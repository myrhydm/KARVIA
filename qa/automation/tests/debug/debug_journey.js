/**
 * Debug current journey state
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function debugJourney() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        const Journey = require('./server/models/Journey');
        const Task = require('./server/models/Task');
        const WeeklyGoal = require('./server/models/WeeklyGoal');
        
        const testUserId = '6871aa152d2ee48df713fc10';
        
        console.log('=== Journey Debug Info ===\n');
        
        // Check journey
        const journey = await Journey.findOne({ user: testUserId, status: 'active' });
        if (journey) {
            console.log('✅ Active journey found');
            console.log('Journey ID:', journey._id);
            console.log('Current Sprint:', journey.currentSprint);
            console.log('Current Day:', journey.currentDay);
            
            const currentSprint = journey.getCurrentSprint();
            console.log('\nFirst Sprint Goals:');
            currentSprint.goals.forEach((goal, index) => {
                console.log(`${index + 1}. ${goal.title} (Day ${goal.day})`);
                console.log(`   Tasks: ${goal.tasks.length}`);
            });
        } else {
            console.log('❌ No active journey found');
            return;
        }
        
        // Check journey tasks in database
        const journeyTasks = await Task.find({ user: testUserId, goal: null });
        console.log(`\n✅ Journey tasks in database: ${journeyTasks.length}`);
        journeyTasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.name} (${task.day}) - Completed: ${task.completed}`);
        });
        
        // Check WeeklyGoals
        const weeklyGoals = await WeeklyGoal.find({ user: testUserId });
        console.log(`\n📋 WeeklyGoals in database: ${weeklyGoals.length}`);
        weeklyGoals.forEach((goal, index) => {
            console.log(`${index + 1}. ${goal.title} - Tasks: ${goal.tasks.length}`);
        });
        
        // Test getCurrentSprintTasks
        const journeyService = require('./server/services/journeyService');
        const currentTasks = await journeyService.getCurrentSprintTasks(testUserId);
        console.log(`\n🎯 getCurrentSprintTasks result: ${currentTasks.length}`);
        currentTasks.forEach((task, index) => {
            console.log(`${index + 1}. ${task.name} (Day ${task.day}) - Goal: ${task.goalTitle}`);
        });
        
    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await mongoose.connection.close();
    }
}

debugJourney();