const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserDream = require('../models/UserDream');
const DreamDiscovery = require('../models/DreamDiscovery');
const WeeklyGoal = require('../models/WeeklyGoal');
const Task = require('../models/Task');
const User = require('../models/User');

// GET /api/consumer/journey/plan - Get LLM-generated plan for display
router.get('/plan', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find the user's most recent dream with a generated plan
        const dream = await UserDream.findOne({ 
            user: userId, 
            planGenerated: true 
        }).sort({ planGeneratedAt: -1 });
        
        if (!dream) {
            return res.status(404).json({
                success: false,
                error: 'No journey found. Please create your dream first.',
                code: 'NO_JOURNEY_FOUND'
            });
        }
        
        // Get the dream discovery data (contains the AI-generated plan structure)
        const dreamDiscovery = await DreamDiscovery.findOne({ 
            userId: userId,
            dreamId: dream._id 
        });
        
        // Get weekly goals created for this dream
        const weeklyGoals = await WeeklyGoal.find({ 
            user: userId,
            _id: { $in: dream.goalIds || [] }
        }).populate('tasks').sort({ createdAt: 1 });
        
        // Get all tasks for these goals
        const allTasks = [];
        weeklyGoals.forEach(goal => {
            if (goal.tasks && goal.tasks.length > 0) {
                goal.tasks.forEach(task => {
                    allTasks.push({
                        id: task._id,
                        name: task.name,
                        description: task.description || '',
                        day: task.day || 1,
                        isCompleted: task.completed,
                        estimatedTime: task.estTime || 30,
                        goalTitle: goal.title
                    });
                });
            }
        });
        
        // Create simplified plan structure
        const planStructure = [];
        if (dreamDiscovery && dreamDiscovery.weekThemes) {
            dreamDiscovery.weekThemes.forEach((theme, index) => {
                const weekGoals = weeklyGoals.filter(goal => 
                    goal.title.includes(`Week ${index + 1}`) || 
                    goal.title.includes(theme)
                );
                
                planStructure.push({
                    title: theme,
                    description: `Week ${index + 1} focus`,
                    tasks: weekGoals.length > 0 ? weekGoals[0].tasks?.map(task => ({
                        name: task.name,
                        description: task.description
                    })) || [] : []
                });
            });
        } else {
            // Fallback: create structure from weekly goals
            weeklyGoals.forEach((goal, index) => {
                planStructure.push({
                    title: goal.title,
                    description: goal.description || `Week ${index + 1} activities`,
                    tasks: goal.tasks?.map(task => ({
                        name: task.name,
                        description: task.description
                    })) || []
                });
            });
        }
        
        const planData = {
            journey: {
                id: dream._id,
                dreamText: dream.dreamText,
                status: 'active',
                currentDay: dream.currentDay || 1,
                createdAt: dream.planGeneratedAt || dream.createdAt
            },
            plan: planStructure,
            tasks: allTasks
        };
        
        res.json({
            success: true,
            data: planData
        });
        
    } catch (error) {
        console.error('Get journey plan error:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to load your plan. Please try again.',
            code: 'PLAN_LOAD_ERROR'
        });
    }
});

// POST /api/consumer/journey/complete-task - Complete a task
router.post('/complete-task', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskId } = req.body;
        
        // Find and update the task
        const task = await Task.findOne({ 
            _id: taskId, 
            user: userId 
        });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found.',
                code: 'TASK_NOT_FOUND'
            });
        }
        
        // Mark task as completed
        task.completed = true;
        task.completedAt = new Date();
        await task.save();
        
        res.json({
            success: true,
            data: {
                taskId: task._id,
                completed: true,
                completedAt: task.completedAt
            },
            message: 'Great job! Task completed successfully.'
        });
        
    } catch (error) {
        console.error('Task completion error:', error);
        res.status(500).json({
            success: false,
            error: 'Unable to complete task. Please try again.',
            code: 'TASK_COMPLETION_ERROR'
        });
    }
});

module.exports = router;