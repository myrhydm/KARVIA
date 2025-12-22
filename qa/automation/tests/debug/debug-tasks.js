/**
 * Debug Tasks Issue
 * Check if tasks exist for the current user and investigate task loading problems
 */

require('dotenv').config();

async function debugTasks() {
    console.log('🔍 Debugging Tasks Issue...');
    
    // Connect to MongoDB
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/goaltracker');
    console.log('📊 Connected to MongoDB');
    
    const User = require('./server/models/User');
    const Task = require('./server/models/Task');
    const UserDream = require('./server/models/UserDream');
    const WeeklyGoal = require('./server/models/WeeklyGoal');
    
    try {
        // Find all users
        const users = await User.find({}).select('_id name email').limit(5);
        console.log('\n👥 Users in system:', users.length);
        users.forEach(user => {
            console.log(`   ${user._id} - ${user.name} (${user.email})`);
        });
        
        if (users.length === 0) {
            console.log('❌ No users found in system');
            return;
        }
        
        // Check the first user's dreams and tasks
        const user = users[0];
        console.log(`\n🎯 Checking user: ${user.name} (${user._id})`);
        
        // Find user's dreams
        const dreams = await UserDream.find({ user: user._id });
        console.log(`   Dreams: ${dreams.length}`);
        dreams.forEach(dream => {
            console.log(`   - ${dream._id}: ${dream.dreamText?.substring(0, 50)}...`);
            console.log(`     Plan generated: ${dream.planGenerated}`);
            console.log(`     Goal IDs: ${dream.goalIds?.length || 0}`);
        });
        
        // Find user's goals
        const goals = await WeeklyGoal.find({ user: user._id });
        console.log(`   Goals: ${goals.length}`);
        goals.forEach(goal => {
            console.log(`   - ${goal._id}: ${goal.title} (Week ${goal.week})`);
        });
        
        // Find user's tasks
        const tasks = await Task.find({ user: user._id }).sort({ day: 1 });
        console.log(`   Tasks: ${tasks.length}`);
        
        if (tasks.length === 0) {
            console.log('❌ No tasks found for user');
        } else {
            console.log('\n📋 User Tasks:');
            tasks.forEach((task, index) => {
                console.log(`   ${index + 1}. ${task._id}`);
                console.log(`      Title: ${task.title || task.name}`);
                console.log(`      Day: ${task.day}`);
                console.log(`      Est Time: ${task.estTime} minutes`);
                console.log(`      Status: ${task.status}`);
                console.log(`      Difficulty: ${task.difficultyLevel}`);
                console.log(`      Category: ${task.skillCategory}`);
                console.log();
            });
            
            // Test API endpoint for the first task
            const firstTask = tasks[0];
            console.log(`🧪 Testing API for task: ${firstTask._id}`);
            
            // This would normally require authentication, but let's check the task structure
            console.log('   Task data structure:');
            console.log(`   - name: ${firstTask.name}`);
            console.log(`   - title: ${firstTask.title}`);
            console.log(`   - rationale: ${firstTask.rationale?.substring(0, 100)}...`);
            console.log(`   - metricsImpacted: ${JSON.stringify(firstTask.metricsImpacted)}`);
        }
        
        // Check today's tasks specifically
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayName = dayNames[today.getDay()];
        
        const todayTasks = await Task.find({ 
            user: user._id, 
            day: todayName,
            status: { $ne: 'completed' }
        });
        
        console.log(`\n📅 Today's tasks (${todayName}): ${todayTasks.length}`);
        todayTasks.forEach(task => {
            console.log(`   - ${task._id}: ${task.title || task.name}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Run the debug
if (require.main === module) {
    debugTasks().catch(console.error);
}

module.exports = { debugTasks };