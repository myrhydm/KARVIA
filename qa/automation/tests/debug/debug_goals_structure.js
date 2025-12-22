/**
 * Debug Goals Page structure issue
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function debugGoalsStructure() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const WeeklyGoal = require('./server/models/WeeklyGoal');
        const Task = require('./server/models/Task');
        const { getStartOfWeek, getStartOfNextWeek } = require('./server/utils/date');
        
        const newUserId = '6872a938420ca385b079218d';
        
        console.log('=== Debug Goals Page Structure ===\n');
        
        // Simulate Goals Page query
        const weekOf = getStartOfWeek();
        const nextWeek = getStartOfNextWeek(weekOf);
        
        console.log(`Date range: ${weekOf} to ${nextWeek}`);
        
        const goals = await WeeklyGoal.find({
            user: newUserId,
            weekOf: { $gte: weekOf, $lt: nextWeek }
        }).populate('tasks');
        
        console.log(`\n📋 WeeklyGoals found: ${goals.length}\n`);
        
        goals.forEach((goal, index) => {
            console.log(`Goal ${index + 1}: "${goal.title}"`);
            console.log(`  ID: ${goal._id}`);
            console.log(`  WeekOf: ${goal.weekOf}`);
            console.log(`  Tasks: ${goal.tasks.length}`);
            goal.tasks.forEach((task, taskIndex) => {
                console.log(`    ${taskIndex + 1}. ${task.name}`);
                console.log(`       - Day: ${task.day}`);
                console.log(`       - EstTime: ${task.estTime}min`);
                console.log(`       - Goal: ${task.goal}`);
                console.log(`       - TaskID: ${task._id}`);
            });
            console.log('');
        });
        
        // Check if there's any data mismatch
        console.log('=== Task-Goal Relationship Check ===');
        const allTasks = await Task.find({ user: newUserId });
        const goalsById = {};
        goals.forEach(goal => {
            goalsById[goal._id.toString()] = goal.title;
        });
        
        allTasks.forEach(task => {
            const goalTitle = goalsById[task.goal?.toString()] || 'Unknown Goal';
            console.log(`Task: "${task.name}" -> Goal: "${goalTitle}"`);
        });
        
    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await mongoose.connection.close();
    }
}

debugGoalsStructure();