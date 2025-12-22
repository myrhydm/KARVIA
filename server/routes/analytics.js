/**
 * server/routes/analytics.js
 * (Optional) Handles routes for fetching more detailed analytics data.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Auth middleware
const Task = require('../models/Task');
const WeeklyGoal = require('../models/WeeklyGoal');
const { getStartOfNextWeek } = require('../utils/date');

router.get('/streak', auth, async (req, res) => {
    try {
        // This is a complex query. For performance, a better approach would be to
        // have a separate 'DailySnapshot' collection that is updated daily.
        // This implementation is for demonstration and may be slow on large datasets.
        
        // Find all tasks completed by the user
        const completedTasks = await Task.find({ user: req.userId, completed: true }).sort({ createdAt: -1 });

        // Group tasks by date
        const tasksByDate = {};
        completedTasks.forEach(task => {
            const date = task.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!tasksByDate[date]) {
                tasksByDate[date] = 0;
            }
            tasksByDate[date]++;
        });

        // Convert to the format expected by the frontend
        const snapshots = Object.keys(tasksByDate).map(date => ({
            date: date,
            tasksCompleted: tasksByDate[date]
        })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort descending

        res.json(snapshots);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Helper to get the Monday of the previous week
function getPreviousWeekStart() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const currentMonday = new Date(today.setDate(diff));
    currentMonday.setHours(0, 0, 0, 0);
    const previousMonday = new Date(currentMonday);
    previousMonday.setDate(previousMonday.getDate() - 7);
    return previousMonday;
}

router.get('/weekly-summary', auth, async (req, res) => {
    try {
        const weekOf = getPreviousWeekStart();
        const nextWeek = getStartOfNextWeek(weekOf);
        const goals = await WeeklyGoal.find({
            user: req.userId,
            weekOf: { $gte: weekOf, $lt: nextWeek }
        }).populate('tasks');

        let stats = {
            weekOf,
            goalsPlanned: goals.length,
            goalsAchieved: 0,
            tasksPlanned: 0,
            tasksCompleted: 0,
            focusTimeSpent: 0
        };

        goals.forEach(g => {
            const tasks = g.tasks || [];
            const completed = tasks.filter(t => t.completed).length;
            if (tasks.length > 0 && completed === tasks.length) stats.goalsAchieved++;
            stats.tasksPlanned += tasks.length;
            stats.tasksCompleted += completed;
            stats.focusTimeSpent += tasks.reduce((s, t) => s + (t.timeSpent || 0), 0);
        });

        // Convert minutes to hours with one decimal
        stats.focusTimeSpent = Math.round((stats.focusTimeSpent / 60) * 10) / 10;

        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
