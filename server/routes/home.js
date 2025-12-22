/**
 * server/routes/home.js
 * Handles the main data fetch for the dashboard.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Auth middleware

// Models
const WeeklyGoal = require('../models/WeeklyGoal');

// Services
const journeyService = require('../services/journeyService');

// Helpers to get the start of the week and the next week
const { getStartOfWeek, getStartOfNextWeek } = require('../utils/date');

// Helper to get the day string (e.g., 'Mon', 'Tue') for a given date
const getDayString = (date = new Date()) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
};

router.get('/', auth, async (req, res) => {
    console.log('GET /api/home - Request received');
    console.log('Query params:', req.query);
    console.log('User ID from auth:', req.user?.id);
    
    try {
        const userId = req.user?.id || req.userId;
        const weekParam = req.query.weekOf ? new Date(req.query.weekOf) : undefined;
        const weekOf = getStartOfWeek(weekParam);

        const dayParam = req.query.day;
        const dateParam = req.query.date ? new Date(req.query.date) : new Date();
        const todayStr = dayParam || getDayString(dateParam);

        console.log('Home route: Query params received:', req.query);
        console.log('Home route: Week param:', weekParam);
        console.log('Home route: Calculated weekOf:', weekOf);
        console.log('Home route: Date param:', dateParam);
        console.log('Home route: Today string:', todayStr);
        console.log('Home route: Fetching goals for user:', userId, 'week:', weekOf, 'today:', todayStr);

        // 1. Check if user has active journey and get journey tasks
        let journeyTasks = [];
        let journeyStatus = null;
        
        try {
            journeyStatus = await journeyService.getJourneyStatus(userId);
            if (journeyStatus.hasActiveJourney) {
                journeyTasks = await journeyService.getCurrentSprintTasks(userId);
                console.log('Home route: Found journey tasks:', journeyTasks.length);
            }
        } catch (journeyError) {
            console.log('Home route: No active journey or journey error:', journeyError.message);
        }

        // 2. Fetch weekly goals for the current week and populate their tasks
        const nextWeek = getStartOfNextWeek(weekOf);
        const weeklyGoals = await WeeklyGoal.find({
            user: userId,
            weekOf: { $gte: weekOf, $lt: nextWeek }
        }).populate('tasks');
        
        console.log('Found weekly goals:', weeklyGoals.length);

        // 3. Gather today's tasks from the populated goals
        let todaysTasks = [];
        console.log('Home route: Looking for tasks with day =', todayStr);
        
        if (weeklyGoals && weeklyGoals.length > 0) {
            weeklyGoals.forEach((goal, goalIndex) => {
                console.log(`Home route: Goal ${goalIndex + 1} (${goal.title}) has ${goal.tasks.length} tasks`);
                if (goal.tasks && Array.isArray(goal.tasks)) {
                    goal.tasks.forEach((task, taskIndex) => {
                        console.log(`  Task ${taskIndex + 1}: "${task.name}" - Day: "${task.day}" (${task.day === todayStr ? 'MATCH' : 'no match'})`);
                        if (task.day === todayStr) {
                            todaysTasks.push(task);
                            console.log('    -> Added to today\'s tasks');
                        }
                    });
                }
            });
        }

        // 4. Prioritize journey tasks if user has active journey
        let finalTodaysTasks = [];
        let finalWeeklyGoals = [...weeklyGoals];
        
        console.log('Home route: Journey tasks length:', journeyTasks.length);
        console.log('Home route: Weekly goals length:', weeklyGoals.length);
        
        if (journeyTasks.length > 0) {
            // Filter journey tasks to show only today's tasks
            const todaysJourneyTasks = journeyTasks.filter(task => task.day === todayStr);
            finalTodaysTasks = [...todaysJourneyTasks];
            console.log(`Home route: Filtered journey tasks from ${journeyTasks.length} to ${todaysJourneyTasks.length} for today (${todayStr})`);
            
            // Since journey tasks are now created as regular WeeklyGoals, 
            // we don't need to create a virtual journey goal anymore
            // Just use the existing weekly goals that contain the journey tasks
            finalWeeklyGoals = [...weeklyGoals];
            console.log('Home route: Using existing WeeklyGoals that contain journey tasks (no duplication)');
        } else {
            // Show regular weekly goal tasks
            finalTodaysTasks = todaysTasks;
            console.log('Home route: No journey tasks, using regular tasks');
        }

        console.log("Today's tasks found:", finalTodaysTasks.length);
        console.log("Today's tasks:", JSON.stringify(finalTodaysTasks, null, 2));

        // 5. Fetch data for analytics (e.g., historical snapshots)
        // This is a simplified version. A real app might store daily summaries.
        // For now, we'll send an empty array as a placeholder.
        const dailySnapshots = []; // To be implemented in analytics.js route

        console.log('Home route: Sending response with finalWeeklyGoals:', finalWeeklyGoals.length);
        console.log('Home route: finalWeeklyGoals data:', JSON.stringify(finalWeeklyGoals, null, 2));
        
        res.json({
            weekOf,
            weeklyGoals: finalWeeklyGoals,
            todaysTasks: finalTodaysTasks,
            dailySnapshots,
            journeyStatus: journeyStatus || { hasActiveJourney: false },
            journeyTasks: journeyTasks
        });
    } catch (err) {
        console.error('Error in home route:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;
