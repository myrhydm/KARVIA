const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const authenticateToken = require('../middleware/auth');
const TrackingUtils = require('../utils/trackingUtils');
const visionToPreferencesService = require('../services/visionToPreferencesService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '../uploads/resumes');
        try {
            await fs.mkdir(uploadsDir, { recursive: true });
            cb(null, uploadsDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        // Create unique filename: userId_timestamp_originalname
        const uniqueName = `${req.user.id}_${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only PDF and Word documents
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get user progress (login count, completed tasks, streak)
router.get('/progress', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Get user's login count and task completion data
        const loginCount = user.loginCount || 1;
        
        // Get actual completed tasks count from database
        const completedTasksCount = await Task.countDocuments({ 
            user: req.user.id, 
            completed: true 
        });
        
        // Get total tasks count for completion percentage
        const totalTasksCount = await Task.countDocuments({ 
            user: req.user.id 
        });
        
        // Update user's completed tasks count in User model
        if (completedTasksCount !== user.completedTasks) {
            user.completedTasks = completedTasksCount;
            await user.save();
        }
        
        // Calculate streak based on recent task completions
        const currentStreak = user.currentStreak || 0;
        
        res.json({
            success: true,
            loginCount,
            completedTasks: completedTasksCount,
            totalTasks: totalTasksCount,
            currentStreak,
            lastLogin: user.lastLogin
        });
        
    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get user tasks
router.get('/tasks', authenticateToken, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id })
            .sort({ createdAt: 1 });
        
        res.json({
            success: true,
            tasks
        });
    } catch (error) {
        console.error('Error fetching user tasks:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Update task completion status
router.put('/tasks/:taskId/complete', authenticateToken, async (req, res) => {
    try {
        const { completed, timeSpent } = req.body;
        
        const task = await Task.findOne({ 
            _id: req.params.taskId, 
            user: req.user.id 
        });
        
        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }
        
        // Update task
        task.completed = completed;
        if (timeSpent !== undefined) {
            task.timeSpent = timeSpent;
        }
        await task.save();
        
        // Update user's completed tasks count
        const user = await User.findById(req.user.id);
        if (user) {
            const completedCount = await Task.countDocuments({ 
                user: req.user.id, 
                completed: true 
            });
            user.completedTasks = completedCount;
            await user.save();
            
            // Track task completion with comprehensive data
            await TrackingUtils.trackTaskGoal('task_completion', user._id, {
                taskId: task._id,
                taskName: task.name,
                completed: completed,
                actualTime: timeSpent || 0,
                estimatedTime: task.estTime,
                timeEfficiency: timeSpent && task.estTime ? (task.estTime / timeSpent) : null,
                totalCompleted: completedCount,
                isReflection: task.isReflection,
                dayOfWeek: task.day,
                completionRate: user.completedTasks / user.totalTasks * 100
            });

            // Track behavioral patterns
            if (completed) {
                // Check for persistence (multiple attempts)
                const taskAttempts = await Task.countDocuments({
                    user: user._id,
                    name: task.name,
                    completed: false
                });

                if (taskAttempts > 0) {
                    await TrackingUtils.trackBehavior('persistence_shown', user._id, {
                        attempts: taskAttempts + 1,
                        timeSpent: timeSpent || 0,
                        context: 'task_completion',
                        successfullyCompleted: true
                    });
                }

                // Check for milestone achievement
                if (completedCount % 5 === 0) {
                    await TrackingUtils.trackTaskGoal('milestone_achieved', user._id, {
                        milestoneType: 'tasks_completed',
                        tasksCompleted: completedCount,
                        journeyDay: user.loginCount || 1
                    });
                }
            }
        }
        
        res.json({
            success: true,
            task,
            message: `Task ${completed ? 'completed' : 'marked incomplete'}`
        });
        
    } catch (error) {
        console.error('Error updating task completion:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Check if user needs preference population from Vision Quest
        const needsPopulation = visionToPreferencesService.needsPreferencePopulation(user);
        
        res.json({
            success: true,
            data: user,
            needsVisionPopulation: needsPopulation
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const {
            fullName,
            phone,
            location,
            bio,
            blogUrl,
            twitterHandle,
            sideProjects,
            preferences
        } = req.body;

        const updateData = {};
        
        // Basic info updates
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (location !== undefined) updateData.location = location;
        if (bio !== undefined) updateData.bio = bio;
        
        // Professional assets updates
        if (blogUrl !== undefined) updateData.blogUrl = blogUrl;
        if (twitterHandle !== undefined) updateData.twitterHandle = twitterHandle;
        if (sideProjects !== undefined) updateData.sideProjects = sideProjects;
        
        // Preferences updates - merge with existing preferences
        if (preferences) {
            // Get current user to merge preferences properly
            const currentUser = await User.findById(req.user.id);
            const currentPrefs = currentUser.preferences ? currentUser.preferences.toObject() : {};
            const currentNotifications = currentPrefs.notifications ? currentPrefs.notifications : {};
            
            updateData.preferences = {
                ...currentPrefs,
                ...preferences
            };
            
            // Handle notifications separately to ensure proper merging
            if (preferences.notifications) {
                updateData.preferences.notifications = {
                    ...currentNotifications,
                    ...preferences.notifications
                };
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        console.error('Error details:', error.message);
        console.error('Update data:', JSON.stringify(updateData, null, 2));
        res.status(500).json({
            success: false,
            error: 'Failed to update user profile'
        });
    }
});

// Upload resume
router.post('/resume', authenticateToken, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const fileData = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            uploadedAt: new Date()
        };

        // Add file to user's resume array
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 
                $push: { resumes: fileData }
            },
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            data: fileData,
            message: 'Resume uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading resume:', error);
        
        // Clean up uploaded file if database operation fails
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to upload resume'
        });
    }
});

// Get user's resumes
router.get('/resume', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('resumes');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user.resumes || []
        });
    } catch (error) {
        console.error('Error fetching user resumes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch resumes'
        });
    }
});

// Download resume
router.get('/resume/:fileId', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const resume = user.resumes.id(req.params.fileId);
        
        if (!resume) {
            return res.status(404).json({
                success: false,
                error: 'Resume not found'
            });
        }

        // Check if file exists
        try {
            await fs.access(resume.path);
        } catch (error) {
            return res.status(404).json({
                success: false,
                error: 'File not found on server'
            });
        }

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
        res.setHeader('Content-Type', resume.mimetype);

        // Send file
        res.sendFile(path.resolve(resume.path));
    } catch (error) {
        console.error('Error downloading resume:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download resume'
        });
    }
});

// Delete resume
router.delete('/resume/:fileId', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const resume = user.resumes.id(req.params.fileId);
        
        if (!resume) {
            return res.status(404).json({
                success: false,
                error: 'Resume not found'
            });
        }

        // Delete file from filesystem
        try {
            await fs.unlink(resume.path);
        } catch (error) {
            console.warn('File not found on filesystem:', error.message);
        }

        // Remove from database
        resume.remove();
        await user.save();

        res.json({
            success: true,
            message: 'Resume deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete resume'
        });
    }
});

// Auto-populate preferences from Vision Quest
router.post('/preferences/populate-from-vision', authenticateToken, async (req, res) => {
    try {
        const populatedPreferences = await visionToPreferencesService.populatePreferencesFromVision(req.user.id);
        
        if (!populatedPreferences) {
            return res.status(404).json({
                success: false,
                error: 'No Vision Quest data found. Please complete the Vision Quest assessment first.'
            });
        }

        res.json({
            success: true,
            data: populatedPreferences,
            message: 'Journey Preferences populated from Vision Quest successfully'
        });
    } catch (error) {
        console.error('Error populating preferences from Vision Quest:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to populate preferences from Vision Quest'
        });
    }
});

// Export user data
router.get('/export', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Prepare export data
        const exportData = {
            profile: {
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                location: user.location,
                bio: user.bio,
                createdAt: user.createdAt,
                preferences: user.preferences
            },
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="manifestor-profile-${user._id}.json"`);

        res.json(exportData);
    } catch (error) {
        console.error('Error exporting user data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export user data'
        });
    }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // This would typically aggregate data from various collections
        // For now, return basic stats
        const user = await User.findById(req.user.id);
        
        const stats = {
            journeysCreated: 0,
            goalsAchieved: 0,
            currentStreak: 0,
            totalXP: 0,
            memberSince: user.createdAt
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user statistics'
        });
    }
});

module.exports = router;