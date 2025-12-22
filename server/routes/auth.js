/**
 * server/routes/auth.js
 * Handles user signup and login routes.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Bring in the User model
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const TrackingUtils = require('../utils/trackingUtils');
const defaultJourneyTasks = require('../config/defaultJourneyTasks');

// Create default journey tasks for new users
async function createDefaultJourneyTasks(userId) {
    try {
        const tasksToCreate = defaultJourneyTasks.map((task, index) => ({
            user: userId,
            name: task.name,
            day: task.day,
            estTime: task.estTime,
            isReflection: task.isReflection,
            completed: false,
            repeatType: 'none',
            // Required enhanced fields for task schema validation
            rationale: task.isReflection 
                ? "Regular reflection helps consolidate learning and plan improvements"
                : "This task builds essential foundation skills for your personal development journey",
            skillCategory: task.isReflection ? 'self_assessment' : 'planning',
            difficultyLevel: 'beginner',
            metricsImpacted: [
                {
                    metric: task.isReflection ? 'clarity' : 'commitment',
                    expectedImpact: 'medium',
                    reasoning: task.isReflection 
                        ? 'Reflection increases clarity about progress and next steps'
                        : 'Taking consistent action builds commitment to your goals'
                }
            ],
            adaptiveMetadata: {
                generationMethod: 'template_based',
                timeCommitmentStyle: 'focused-blocks', // Default for new users
                confidenceLevel: 50, // Default starting confidence
                archetypeContext: 'general'
            },
            goalIndex: Math.floor(index / 7), // Roughly group tasks by weeks into goal sections
            weekNumber: Math.floor(index / 7) + 1 // Distribute across multiple weeks
        }));

        await Task.insertMany(tasksToCreate);
        console.log(`✅ Created ${tasksToCreate.length} default journey tasks for user ${userId}`);
        
        return tasksToCreate.length;
    } catch (error) {
        console.error('❌ Error creating default journey tasks:', error);
        throw error;
    }
}

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post(
    '/signup',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            user = new User({ 
                name, 
                email, 
                password, 
                onboardingCompleted: false 
            });

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            // Create default journey tasks for new user
            try {
                const taskTotal = await createDefaultJourneyTasks(user.id);
                console.log(`🎯 Default tasks created for new user: ${user.name}`);

                // Track task creation
                await TrackingUtils.trackTaskGoal('task_creation', user.id, {
                    taskCount: taskTotal,
                    taskType: 'journey_default',
                    automated: true
                });
            } catch (taskError) {
                console.warn('⚠️ Failed to create default tasks, but user creation succeeded:', taskError.message);
            }

            // Track user signup
            await TrackingUtils.trackAuth('user_signup', user.id, {
                method: 'email',
                onboardingCompleted: false,
                defaultTasksCreated: true
            });

            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION || '7d' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ 
                        token,
                        name: user.name,
                        onboardingCompleted: user.onboardingCompleted 
                    });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            // Update login tracking - only increment if it's a new day
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date(0);
            lastLogin.setHours(0, 0, 0, 0);
            
            if (today.getTime() > lastLogin.getTime()) {
                // New day login - increment count
                user.loginCount = (user.loginCount || 0) + 1;
                user.lastLogin = new Date();
                await user.save();
                
                console.log(`📅 User ${user.name} login count updated to: ${user.loginCount}`);
                
                // Track daily login with comprehensive data
                await TrackingUtils.trackAuth('daily_login', user.id, {
                    loginCount: user.loginCount,
                    isNewDay: true,
                    consecutiveDays: user.currentStreak || 1,
                    timeSinceLastLogin: today.getTime() - lastLogin.getTime(),
                    loginCountGrowth: user.loginCount > 1 ? 1 : 0
                });
            } else {
                console.log(`📅 User ${user.name} already logged in today, count remains: ${user.loginCount || 1}`);
                
                // Track repeat login
                await TrackingUtils.trackAuth('repeat_login', user.id, {
                    loginCount: user.loginCount || 1,
                    isNewDay: false,
                    timeSinceLastLogin: new Date().getTime() - lastLogin.getTime()
                });
            }

            const payload = {
                user: {
                    id: user.id,
                },
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION || '7d' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ 
                        token,
                        name: user.name,
                        onboardingCompleted: user.onboardingCompleted 
                    });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   POST /api/auth/onboarding
// @desc    Save user onboarding data with dream parsing
// @access  Private
router.post('/onboarding', auth, async (req, res) => {
    try {
        const { dream, timeline, confidence, parsedDream } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // If parsed dream data is provided, use it; otherwise store raw dream data
        const dreamData = parsedDream ? {
            rawDream: dream.trim(),
            parsedDream: parsedDream,
            timeline: parseInt(timeline),
            confidence: parseInt(confidence),
            dreamType: parsedDream.mode,
            qualityScore: parsedDream.qualityScore,
            extractedAt: new Date(),
            completedAt: new Date()
        } : {
            dream: dream.trim(),
            timeline: parseInt(timeline),
            confidence: parseInt(confidence),
            completedAt: new Date()
        };

        // Update user with onboarding data
        user.onboardingCompleted = true;
        user.onboardingData = dreamData;

        // Store in stage data if using stage system
        if (user.stageData) {
            user.stageData.set('onboardingData', dreamData);
        }

        await user.save();

        res.json({ 
            msg: 'Onboarding completed successfully',
            onboardingCompleted: true,
            dreamParsed: !!parsedDream
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/auth/onboarding-status
// @desc    Check user onboarding status
// @access  Private
router.get('/onboarding-status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({
            onboardingCompleted: user.onboardingCompleted,
            onboardingData: user.onboardingData
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/complete-onboarding
// @desc    Complete onboarding process (after vision questionnaire)
// @access  Private
router.post('/complete-onboarding', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Mark onboarding as completed
        user.onboardingCompleted = true;
        if (!user.onboardingData) {
            user.onboardingData = {};
        }
        user.onboardingData.visionQuestionnaireCompleted = true;
        user.onboardingData.completedAt = new Date();

        await user.save();

        res.json({ 
            msg: 'Onboarding completed successfully',
            onboardingCompleted: true
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/migrate-existing-users
// @desc    Migrate existing users to have onboarding completed (admin only)
// @access  Private
router.post('/migrate-existing-users', auth, async (req, res) => {
    try {
        // Simple admin check - in production, you'd want proper admin authentication
        const user = await User.findById(req.user.id);
        if (!user || user.email !== 'admin@karvia.com') {
            return res.status(403).json({ msg: 'Admin access required' });
        }

        // Find all users who don't have onboardingCompleted field set to true
        const usersToUpdate = await User.find({
            $or: [
                { onboardingCompleted: { $exists: false } },
                { onboardingCompleted: false }
            ]
        });

        console.log(`Found ${usersToUpdate.length} users to update`);

        // Update each user
        let updatedCount = 0;
        for (const userToUpdate of usersToUpdate) {
            // Skip newly created users (created in the last hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (userToUpdate.createdAt > oneHourAgo) {
                continue;
            }

            await User.findByIdAndUpdate(userToUpdate._id, {
                onboardingCompleted: true,
                onboardingData: {
                    dream: 'Legacy user - onboarding not completed',
                    timeline: 12,
                    confidence: 50,
                    completedAt: new Date()
                }
            });
            
            updatedCount++;
            console.log(`Updated user: ${userToUpdate.email}`);
        }

        res.json({ 
            msg: 'Migration completed successfully',
            updatedCount: updatedCount,
            totalFound: usersToUpdate.length
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
