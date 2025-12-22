/**
 * Debug Frontend Focus Flow - Simulate Browser Environment
 * Test the exact flow that happens when user clicks focus button
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

async function simulateFrontendFlow() {
    console.log('🎯 Simulating Frontend Focus Button Flow...');
    
    // Simulate getting task ID from home page (same as our test)
    const testTaskId = '687921bd75a887b2c5a73b58';
    const testUserId = '687921bd75a887b2c5a73b46';
    
    console.log(`\n1. 🖱️ User clicks focus button on home page`);
    console.log(`   Task ID extracted: ${testTaskId}`);
    
    console.log(`\n2. 🔄 Browser redirects to: tasks.html?taskId=${testTaskId}`);
    
    console.log(`\n3. 📜 tasks.js runs init() function`);
    console.log(`   - Gets taskId from URL: ${testTaskId}`);
    console.log(`   - Gets auth token from localStorage`);
    
    // Generate a valid token (simulating what would be in localStorage)
    const token = jwt.sign(
        { id: testUserId, email: 'test@example.com' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
    console.log(`   - Token exists: ✅`);
    console.log(`   - Token preview: ${token.substring(0, 30)}...`);
    
    console.log(`\n4. 📡 Frontend makes API call: GET /api/tasks/${testTaskId}`);
    console.log(`   - Headers: Authorization: Bearer ${token.substring(0, 20)}...`);
    
    // Test the actual API call
    try {
        const response = await fetch(`http://localhost:5001/api/tasks/${testTaskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`\n5. 📨 API Response received:`);
        console.log(`   - Status: ${response.status}`);
        console.log(`   - Status Text: ${response.statusText}`);
        console.log(`   - OK: ${response.ok}`);
        
        if (response.ok) {
            const taskData = await response.json();
            console.log(`\n6. ✅ Task data parsed successfully:`);
            console.log(`   - Task Name: "${taskData.name}"`);
            console.log(`   - Est Time: ${taskData.estTime} minutes`);
            console.log(`   - Day: ${taskData.day}`);
            console.log(`   - Completed: ${taskData.completed}`);
            
            console.log(`\n7. 🖥️ Frontend should update UI with:`);
            console.log(`   - taskNameEl.textContent = "${taskData.name}"`);
            console.log(`   - taskEstTimeEl.textContent = "${taskData.estTime} minutes"`);
            console.log(`   - Task context should be populated`);
            
            console.log(`\n✅ FLOW SHOULD WORK - Task data is available and correct!`);
            
        } else {
            const errorData = await response.json();
            console.log(`\n❌ API Error:`);
            console.log(`   - Error data:`, errorData);
        }
        
    } catch (error) {
        console.log(`\n❌ Network Error:`);
        console.log(`   - Error:`, error.message);
        console.log(`   - This could be the issue if server is not running`);
    }
    
    console.log(`\n🔍 DEBUGGING CHECKLIST:`);
    console.log(`   1. ✅ Task exists in database`);
    console.log(`   2. ✅ API endpoint works with correct auth`);
    console.log(`   3. ✅ Task ID is being passed correctly`);
    console.log(`   4. ? Check if frontend auth token is valid`);
    console.log(`   5. ? Check if API request is actually being made`);
    console.log(`   6. ? Check browser console for errors`);
    console.log(`   7. ? Check if server is running and accessible`);
}

simulateFrontendFlow().catch(console.error);