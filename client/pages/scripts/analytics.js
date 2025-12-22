/**
 * analytics.js
 * Handles calculation of user progress, streaks, and other stats.
 */

/**
 * Calculates the overall completion rate of weekly goals.
 * @param {Array<Object>} goals - An array of goal objects. Each goal should have a 'tasks' array.
 * Each task should have a 'completed' boolean property.
 * @returns {number} The percentage of completed tasks across all goals (0-100).
 */
function computeWeeklyCompletionRate(goals = []) {
    let totalTasks = 0;
    let completedTasks = 0;

    if (!goals || goals.length === 0) {
        return 0;
    }

    goals.forEach(goal => {
        if (goal.tasks && goal.tasks.length > 0) {
            totalTasks += goal.tasks.length;
            completedTasks += goal.tasks.filter(task => task.completed).length;
        }
    });

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

/**
 * Calculates the user's current daily streak of completing at least one task.
 * This is a simplified example. A real implementation would need more robust date handling.
 * @param {Array<Object>} snapshots - An array of daily snapshot objects, sorted by date descending.
 * Each snapshot should have a 'date' (e.g., '2025-06-11') and 'tasksCompleted' > 0.
 * @returns {number} The number of consecutive days in the streak.
 */
function computeDailyStreak(snapshots = []) {
    if (!snapshots || snapshots.length === 0) {
        return 0;
    }

    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < snapshots.length; i++) {
        const snapshotDate = new Date(snapshots[i].date);
        snapshotDate.setHours(0,0,0,0); // Normalize date

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);

        if (snapshotDate.getTime() === expectedDate.getTime() && snapshots[i].tasksCompleted > 0) {
            streak++;
        } else {
            break; // Streak is broken
        }
    }
    
    return streak;
}

/**
 * Calculates statistics for today's tasks.
 * @param {Array<Object>} tasks - An array of today's task objects.
 * Each task should have a 'completed' boolean and 'timeSpent' in minutes.
 * @returns {Object} An object containing tasksCompleted today and totalFocusTime in hours.
 */
function computeTodayStats(tasks = []) {
     if (!tasks || tasks.length === 0) {
        return { tasksCompleted: 0, tasksPlanned: 0, totalFocusTime: 0 };
    }

    const completedTasks = tasks.filter(task => task.completed);
    const totalMinutes = completedTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);

    return {
        tasksCompleted: completedTasks.length,
        tasksPlanned: tasks.length,
        totalFocusTime: Math.round((totalMinutes / 60) * 10) / 10, // Round to one decimal place
    };
}

/**
 * Calculates planned and completed focus time for a set of weekly goals.
 * @param {Array<Object>} goals - Weekly goals populated with their tasks.
 * Each task should have 'estTime', 'timeSpent', and 'completed' properties.
 * @returns {Object} { plannedMinutes, completedMinutes }
 */
function computeFocusTimeStats(goals = []) {
    let planned = 0;
    let completed = 0;

    if (!goals || goals.length === 0) {
        return { plannedMinutes: 0, completedMinutes: 0 };
    }

    goals.forEach(goal => {
        const tasks = goal.tasks || [];
        tasks.forEach(task => {
            planned += task.estTime || 0;
            if (task.completed) {
                completed += task.timeSpent || 0;
            }
        });
    });

    return { plannedMinutes: planned, completedMinutes: completed };
}

/**
 * Calculates planned and completed focus time for an array of tasks.
 * @param {Array<Object>} tasks - Tasks with optional 'estTime', 'timeSpent', and 'completed'.
 * @returns {Object} { plannedMinutes, completedMinutes }
 */
function computeFocusTimeStatsForTasks(tasks = []) {
    let planned = 0;
    let completed = 0;
    tasks.forEach(t => {
        planned += t.estTime || 0;
        if (t.completed) completed += t.timeSpent || 0;
    });
    return { plannedMinutes: planned, completedMinutes: completed };
}
