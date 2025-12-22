/**
 * Detailed Frontend Debugging
 * Check all possible failure points in the frontend flow
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

async function detailedFrontendDebug() {
    console.log('🔍 DETAILED FRONTEND DEBUGGING');
    console.log('===============================\n');
    
    const testTaskId = '687921bd75a887b2c5a73b58';
    const testUserId = '687921bd75a887b2c5a73b46';
    
    // Test 1: Valid token scenario
    console.log('TEST 1: ✅ Valid Authentication Token');
    console.log('------------------------------------');
    
    const validToken = jwt.sign(
        { id: testUserId, email: 'test@example.com' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
    
    await testAPICall(testTaskId, validToken, 'Valid Token');
    
    // Test 2: Expired token scenario
    console.log('\nTEST 2: ⏰ Expired Authentication Token');
    console.log('---------------------------------------');
    
    const expiredToken = jwt.sign(
        { id: testUserId, email: 'test@example.com' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '-1h' } // Expired 1 hour ago
    );
    
    await testAPICall(testTaskId, expiredToken, 'Expired Token');
    
    // Test 3: Invalid token scenario
    console.log('\nTEST 3: ❌ Invalid Authentication Token');
    console.log('---------------------------------------');
    
    await testAPICall(testTaskId, 'invalid-token-123', 'Invalid Token');
    
    // Test 4: No token scenario
    console.log('\nTEST 4: 🚫 No Authentication Token');
    console.log('----------------------------------');
    
    await testAPICall(testTaskId, null, 'No Token');
    
    // Test 5: Wrong task ID scenario
    console.log('\nTEST 5: 🔍 Non-existent Task ID');
    console.log('-------------------------------');
    
    await testAPICall('123456789012345678901234', validToken, 'Non-existent Task');
    
    // Test 6: Wrong user's task scenario
    console.log('\nTEST 6: 🚫 Access Another User\'s Task');
    console.log('-------------------------------------');
    
    // Create token for different user
    const wrongUserToken = jwt.sign(
        { id: '6879220975a887b2c5a73b68', email: 'wrong@example.com' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
    
    await testAPICall(testTaskId, wrongUserToken, 'Wrong User Token');
    
    console.log('\n🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('=============================');
    console.log('The most likely issues causing "Loading Task..." are:');
    console.log('1. 🔐 User\'s auth token in localStorage is invalid/expired');
    console.log('2. 🌐 Network connectivity issues');
    console.log('3. 🖥️ JavaScript errors in browser console');
    console.log('4. 🔄 API request not being made due to frontend errors\n');
    
    console.log('TO DEBUG FURTHER:');
    console.log('1. Open browser developer tools');
    console.log('2. Check localStorage.getItem(\'authToken\')');
    console.log('3. Look for JavaScript errors in console');
    console.log('4. Check Network tab for failed requests');
    console.log('5. Test with a fresh login to get new token');
}

async function testAPICall(taskId, token, scenario) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
            method: 'GET',
            headers: headers
        });
        
        console.log(`📊 ${scenario} Result:`);
        console.log(`   Status: ${response.status} (${response.statusText})`);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ SUCCESS: Task "${data.name}" loaded`);
            console.log(`   📋 Frontend would show: "${data.name}" - ${data.estTime} minutes`);
        } else {
            const errorData = await response.json();
            console.log(`   ❌ ERROR: ${errorData.msg || errorData.message}`);
            console.log(`   🖥️ Frontend would show: "Loading Task..." (stuck)`);
        }
        
    } catch (error) {
        console.log(`📊 ${scenario} Result:`);
        console.log(`   ❌ NETWORK ERROR: ${error.message}`);
        console.log(`   🖥️ Frontend would show: "Loading Task..." (stuck)`);
    }
}

detailedFrontendDebug().catch(console.error);