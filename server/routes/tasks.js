/**
 * server/routes/tasks.js
 * Handles routes for individual task actions.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Auth middleware
const Task = require('../models/Task');
const WeeklyGoal = require('../models/WeeklyGoal');
const { willExceedLimits } = require('../utils/limits');
const { getStartOfNextWeek } = require('../utils/date');

router.post('/', auth, async (req, res) => {
    const { goalId, name, estTime, day } = req.body;

    if (!goalId || !name || estTime === undefined || !day) {
        return res.status(400).json({ msg: 'Required fields missing.' });
    }
    
    // Post-processing filter: Prevent past-day task creation
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIndex = today.getDay();
    const taskDayIndex = dayNames.indexOf(day);
    
    // Only consider it a past day if it's not Sunday (Sunday can be next week)
    const isPastDay = taskDayIndex !== -1 && taskDayIndex < todayIndex && day !== 'Sun';
    
    let finalDay = day;
    if (isPastDay) {
        console.warn(`⚠️ Task "${name}" scheduled for past day ${day}, reassigning to today`);
        finalDay = dayNames[todayIndex]; // Reassign to today
    }

    try {
        const userId = req.user?.id || req.userId;
        const goal = await WeeklyGoal.findOne({ _id: goalId, user: userId });
        if (!goal) {
            return res.status(404).json({ msg: 'Goal not found' });
        }

        const weekStart = goal.weekOf;
        const nextWeek = getStartOfNextWeek(weekStart);
        const weekGoals = await WeeklyGoal.find({
            user: userId,
            weekOf: { $gte: weekStart, $lt: nextWeek }
        }, '_id');
        const goalIds = weekGoals.map(g => g._id);
        const existingTasks = goalIds.length > 0 ?
            await Task.countDocuments({ user: userId, goal: { $in: goalIds } }) : 0;

        if (willExceedLimits(weekGoals.length, existingTasks, 0, 1)) {
            return res.status(400).json({ msg: 'Weekly goal or task limit exceeded.' });
        }

        const task = new Task({
            user: userId,
            goal: goalId,
            name,
            estTime,
            day: finalDay // Use the validated day
        });

        const savedTask = await task.save();
        goal.tasks.push(savedTask._id);
        await goal.save();

        res.status(201).json(savedTask);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/:id', auth, async (req, res) => {
    console.log('GET /api/tasks/:id - Request received for task ID:', req.params.id);
    console.log('User ID from auth:', req.user?.id);
    
    try {
        const userId = req.user?.id || req.userId;
        const task = await Task.findById(req.params.id);
        
        console.log('Found task:', task ? 'Yes' : 'No');
        if (task) {
            console.log('Task user ID:', task.user.toString());
            console.log('Request user ID:', userId);
            console.log('User match:', task.user.toString() === userId);
        }
        
        if (!task) return res.status(404).json({ msg: 'Task not found' });
        if (task.user.toString() !== userId) {
            console.log('Authorization failed - user mismatch');
            return res.status(401).json({ msg: 'User not authorized' });
        }
        
        // Enhanced task response with computed insights
        const enhancedTask = {
            ...task.toObject(),
            
            // Computed insights (no database changes needed)
            computedInsights: {
                timeEfficiency: task.timeSpent && task.estTime ? 
                    (task.timeSpent / task.estTime * 100).toFixed(1) + '%' : null,
                
                progressStatus: task.completed ? 'completed' : 
                    (task.timeSpent > 0 ? 'in_progress' : 'not_started'),
                    
                familiarityDisplay: task.userFamiliarity ? 
                    task.userFamiliarity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                    'Not Rated',
                    
                suggestedNextSteps: generateTaskSuggestions(task, userId),
                
                contextualTips: generateContextualTips(task)
            }
        };

        console.log('Returning enhanced task with insights');
        res.json(enhancedTask);
    } catch (err) {
        console.error('Error in GET task:', err.message);
        console.error('Full error:', err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        if (task.user.toString() !== userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { name, estTime, day, completed, timeSpent } = req.body;
        if (name !== undefined) task.name = name;
        if (estTime !== undefined) task.estTime = estTime;
        if (day !== undefined) task.day = day;
        if (completed !== undefined) task.completed = completed;
        if (timeSpent !== undefined) task.timeSpent = timeSpent;

        await task.save();

        res.json(task);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});

router.patch('/:id/complete', auth, async (req, res) => {
    console.log('PATCH /api/tasks/:id/complete - Request received for task ID:', req.params.id);
    console.log('User ID from auth:', req.user?.id);
    console.log('Request body:', req.body);
    
    try {
        // Find the task by its ID
        let task = await Task.findById(req.params.id);
        
        console.log('Found task:', task ? 'Yes' : 'No');
        if (task) {
            console.log('Task before update:', {
                id: task._id,
                name: task.name,
                completed: task.completed,
                timeSpent: task.timeSpent,
                user: task.user
            });
        }

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Ensure the user owns the task
        const userId = req.user?.id || req.userId;
        if (task.user.toString() !== userId) {
            console.log('Authorization failed - user mismatch');
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Update the task properties
        task.completed = true;
        
        // Optionally receive time spent from the client
        if (req.body.timeSpent) {
            task.timeSpent = req.body.timeSpent;
        }
        
        // Handle completion feedback if provided
        if (req.body.completionFeedback) {
            const { valueRating, actualDifficulty, notes } = req.body.completionFeedback;
            task.completionFeedback = {
                valueRating: valueRating || null,
                actualDifficulty: actualDifficulty || null,
                clarityRating: null, // Not collected in this version
                notes: notes || ''
            };
        }

        await task.save();
        
        console.log('Task after update:', {
            id: task._id,
            name: task.name,
            completed: task.completed,
            timeSpent: task.timeSpent,
            user: task.user
        });
        console.log('Task completion successful for:', task.name);

        res.json(task);
    } catch (err) {
        console.error('Error in task completion:', err.message);
        console.error('Full error:', err);
        // Handle cases where the ID is not a valid ObjectId
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});

router.patch('/:id/postpone', auth, async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ msg: 'Task not found' });
        }

        // Ensure the user owns the task
        const userId = req.user?.id || req.userId;
        if (task.user.toString() !== userId) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        
        const { newDay, timeSpent } = req.body;
        if (!newDay) {
            return res.status(400).json({ msg: 'New day required to postpone.' });
        }

        task.day = newDay;
        if (timeSpent !== undefined) {
            task.timeSpent = timeSpent;
        }

        await task.save();

        res.json(task);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});

// PATCH /api/tasks/:id/familiarity - Update task familiarity rating
router.patch('/:id/familiarity', auth, async (req, res) => {
    console.log('PATCH /api/tasks/:id/familiarity - Request received for task ID:', req.params.id);
    
    try {
        const userId = req.user?.id || req.userId;
        const task = await Task.findOne({ _id: req.params.id, user: userId });
        
        if (!task) {
            console.log('Task not found or user not authorized');
            return res.status(404).json({ msg: 'Task not found' });
        }
        
        const { userFamiliarity } = req.body;
        
        // Validate familiarity value
        const validFamiliarity = ['know_this', 'somewhat_familiar', 'no_idea'];
        if (!validFamiliarity.includes(userFamiliarity)) {
            return res.status(400).json({ msg: 'Invalid familiarity rating' });
        }
        
        task.userFamiliarity = userFamiliarity;
        await task.save();
        
        console.log(`Task ${req.params.id} familiarity updated to: ${userFamiliarity}`);
        res.json({ success: true, userFamiliarity: task.userFamiliarity });
        
    } catch (err) {
        console.error('Error updating familiarity rating:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Task not found' });
        }
        res.status(500).send('Server Error');
    }
});


// Helper functions for enhanced task insights
function generateTaskSuggestions(task, userId) {
    const suggestions = [];
    
    if (!task.userFamiliarity) {
        suggestions.push('Rate your familiarity with this type of task');
    }
    
    if (!task.rationale) {
        suggestions.push('Add a rationale to understand why this task matters');
    }
    
    if (task.userFamiliarity === 'no_idea') {
        suggestions.push('Start with 10 minutes of research before diving in');
    }
    
    if (task.estTime > 60) {
        suggestions.push('Consider using the Pomodoro technique for this longer task');
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
}

function generateContextualTips(task) {
    const tips = [];
    
    // Time-based tips
    if (task.estTime <= 15) {
        tips.push('Quick task - perfect for filling small gaps in your schedule');
    } else if (task.estTime >= 60) {
        tips.push('Longer task - make sure you have uninterrupted time');
    }
    
    // Priority-based tips  
    if (task.priority === 'high') {
        tips.push('High priority - schedule this for your peak energy time');
    }
    
    // Familiarity-based tips
    if (task.userFamiliarity === 'know_this') {
        tips.push('You know this well - trust your expertise');
    }
    
    return tips;
}

module.exports = router;
