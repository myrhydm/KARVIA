/**
 * Debug Focus Button Flow
 * Test the complete flow from home page focus button to tasks page
 */

require('dotenv').config();

async function debugFocusFlow() {
    console.log('🎯 Debugging Focus Button Flow...');
    
    // Connect to MongoDB
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/goaltracker');
    console.log('📊 Connected to MongoDB');
    
    const User = require('./server/models/User');
    const Task = require('./server/models/Task');
    const UserDream = require('./server/models/UserDream');
    
    try {
        // Get the first user with tasks
        const users = await User.find({}).limit(5);
        console.log(`\n👥 Found ${users.length} users`);
        
        for (const user of users) {
            const tasks = await Task.find({ user: user._id }).limit(5);
            if (tasks.length > 0) {
                console.log(`\n📋 Testing user: ${user.name} (${user._id})`);
                console.log(`   Tasks: ${tasks.length}`);
                
                // Test the first task
                const firstTask = tasks[0];
                console.log(`\n🎯 Testing task: ${firstTask._id}`);
                console.log(`   Title: ${firstTask.title || firstTask.name}`);
                console.log(`   Day: ${firstTask.day}`);
                console.log(`   Status: ${firstTask.status}`);
                console.log(`   Est Time: ${firstTask.estTime} minutes`);
                
                // Check task data completeness
                console.log(`\n📊 Task Data Completeness:`);
                console.log(`   Has name/title: ${!!(firstTask.name || firstTask.title)}`);
                console.log(`   Has rationale: ${!!firstTask.rationale}`);
                console.log(`   Has difficulty: ${!!firstTask.difficultyLevel}`);
                console.log(`   Has skill category: ${!!firstTask.skillCategory}`);
                console.log(`   Has metrics impact: ${firstTask.metricsImpacted?.length > 0}`);
                console.log(`   Has goal title: ${!!firstTask.goalTitle}`);
                
                // Simulate the API call that tasks.js makes
                console.log(`\n🔍 Simulating API call: GET /api/tasks/${firstTask._id}`);
                
                const taskData = {
                    _id: firstTask._id,
                    name: firstTask.name,
                    title: firstTask.title,
                    estTime: firstTask.estTime,
                    day: firstTask.day,
                    rationale: firstTask.rationale,
                    difficultyLevel: firstTask.difficultyLevel,
                    skillCategory: firstTask.skillCategory,
                    metricsImpacted: firstTask.metricsImpacted,
                    goalTitle: firstTask.goalTitle,
                    status: firstTask.status,
                    user: firstTask.user
                };
                
                console.log(`📡 API Response simulation:`, JSON.stringify(taskData, null, 2));
                
                // Check what would happen in tasks.js updateTaskContext
                console.log(`\n🔧 Frontend Processing Check:`);
                console.log(`   taskNameEl would show: "${firstTask.name || firstTask.title}"`);
                console.log(`   taskEstTimeEl would show: "${firstTask.estTime} minutes"`);
                console.log(`   rationale would show: "${firstTask.rationale || 'This task will help you progress toward your goals.'}"`);
                console.log(`   difficulty would show: "${firstTask.difficultyLevel || 'beginner'}"`);
                console.log(`   goal would show: "${firstTask.goalTitle || 'General Progress'}"`);
                console.log(`   skill would show: "${firstTask.skillCategory || 'general'}"`);
                
                // Check if this task would appear on home page
                const today = new Date();
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const todayName = dayNames[today.getDay()];
                
                console.log(`\n📅 Home Page Display Check:`);
                console.log(`   Today is: ${todayName}`);
                console.log(`   Task is for: ${firstTask.day}`);
                console.log(`   Would show on home page: ${firstTask.day === todayName ? '✅ YES' : '❌ NO'}`);
                
                // Test URL construction
                const testUrl = `tasks.html?taskId=${firstTask._id}`;
                console.log(`\n🔗 URL that would be generated: ${testUrl}`);
                
                break; // Test only first user with tasks
            }
        }
        
        // Check for today's tasks specifically
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayName = dayNames[today.getDay()];
        
        console.log(`\n📅 Today's Tasks Check (${todayName}):`);
        const todayTasks = await Task.find({ 
            day: todayName,
            status: { $ne: 'completed' }
        }).limit(10);
        
        console.log(`   Found ${todayTasks.length} incomplete tasks for today`);
        todayTasks.forEach((task, index) => {
            console.log(`   ${index + 1}. ${task._id} - ${task.name || task.title} (User: ${task.user})`);
        });
        
        if (todayTasks.length === 0) {
            console.log(`   ⚠️  No tasks for today - focus button might not work`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Run the debug
if (require.main === module) {
    debugFocusFlow().catch(console.error);
}

module.exports = { debugFocusFlow };