/**
 * Debug WeeklyGoals in database after journey creation
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function debugGoalsDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        const WeeklyGoal = require('./server/models/WeeklyGoal');
        const Task = require('./server/models/Task');
        const Journey = require('./server/models/Journey');
        
        const testUserId = '6871aa152d2ee48df713fc10';
        
        console.log('=== Database Debug After Journey Creation ===\n');
        
        // Check all WeeklyGoals for user
        const allGoals = await WeeklyGoal.find({ user: testUserId }).populate('tasks');
        console.log(`📋 Total WeeklyGoals for user: ${allGoals.length}`);
        
        if (allGoals.length > 0) {
            allGoals.forEach((goal, index) => {
                console.log(`Goal ${index + 1}: "${goal.title}"`);
                console.log(`  ID: ${goal._id}`);
                console.log(`  WeekOf: ${goal.weekOf}`);
                console.log(`  Tasks: ${goal.tasks.length}`);
                if (goal.tasks.length > 0) {
                    goal.tasks.forEach((task, taskIndex) => {
                        console.log(`    ${taskIndex + 1}. ${task.name} (${task.day}, ${task.estTime}min)`);
                    });
                }
                console.log('');
            });
        }
        
        // Check all Tasks for user
        const allTasks = await Task.find({ user: testUserId });
        console.log(`📝 Total Tasks for user: ${allTasks.length}`);
        
        const tasksByGoal = {};
        allTasks.forEach(task => {
            const goalKey = task.goal ? task.goal.toString() : 'null';
            if (!tasksByGoal[goalKey]) tasksByGoal[goalKey] = [];
            tasksByGoal[goalKey].push(task);
        });
        
        Object.keys(tasksByGoal).forEach(goalId => {
            console.log(`Goal ID ${goalId}: ${tasksByGoal[goalId].length} tasks`);
        });
        
        // Check journey
        const journey = await Journey.findOne({ user: testUserId, status: 'active' });
        if (journey) {
            console.log(`\n🎯 Journey found: ${journey._id}`);
            console.log(`Full journey plan stored: ${journey.fullJourneyPlan ? 'Yes' : 'No'}`);
            if (journey.fullJourneyPlan) {
                console.log(`Journey weeks: ${journey.fullJourneyPlan.weeks?.length || 0}`);
            }
        }
        
        // Test the week range query that goals endpoint uses
        const { getStartOfWeek, getStartOfNextWeek } = require('./server/utils/date');
        const weekOf = new Date('2025-07-07T00:00:00.000Z');
        const nextWeek = getStartOfNextWeek(weekOf);
        
        console.log(`\n🔍 Testing goals endpoint query:`);
        console.log(`WeekOf: ${weekOf}`);
        console.log(`NextWeek: ${nextWeek}`);
        
        const goalsInRange = await WeeklyGoal.find({
            user: testUserId,
            weekOf: { $gte: weekOf, $lt: nextWeek }
        });
        
        console.log(`Goals in date range: ${goalsInRange.length}`);
        
    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await mongoose.connection.close();
    }
}

debugGoalsDB();