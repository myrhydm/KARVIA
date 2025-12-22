/**
 * Simple test to check basic Goals CRUD functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const TEST_USER = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'testpass123'
};

async function runSimpleTest() {
    try {
        console.log('🧪 Running simple Goals CRUD test...\n');

        // Step 1: Create test user
        console.log('1. Creating test user...');
        try {
            const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, TEST_USER);
            console.log('✅ User created successfully');
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.msg === 'User already exists') {
                console.log('ℹ️  User already exists, continuing...');
            } else {
                throw error;
            }
        }

        // Step 2: Login
        console.log('2. Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        const headers = { Authorization: `Bearer ${token}` };
        const currentWeek = new Date();

        // Step 3: Test Goal Creation
        console.log('3. Testing goal creation...');
        
        // Test valid goal
        const goalData = {
            title: 'Test Goal',
            weekOf: currentWeek.toISOString(),
            tasks: [
                {
                    name: 'Test Task 1',
                    estTime: 60,
                    day: 'Mon',
                    repeatType: 'none'
                },
                {
                    name: 'Test Task 2',
                    estTime: 30,
                    day: 'Tue',
                    repeatType: 'daily'
                }
            ]
        };

        const createResponse = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, goalData, { headers });
        console.log('✅ Goal created successfully:', createResponse.data._id);
        const goalId = createResponse.data._id;

        // Step 4: Test Goal Retrieval
        console.log('4. Testing goal retrieval...');
        const getResponse = await axios.get(`${BASE_URL}/api/weeklyGoals?weekOf=${currentWeek.toISOString()}`, { headers });
        console.log('Get response data:', getResponse.data);
        const goals = getResponse.data.goals || getResponse.data || [];
        console.log('✅ Goals retrieved:', goals.length);

        // Step 5: Test Goal Update
        console.log('5. Testing goal update...');
        const updateData = {
            title: 'Updated Test Goal',
            weekOf: currentWeek.toISOString(),
            tasks: [
                {
                    name: 'Updated Task',
                    estTime: 45,
                    day: 'Wed',
                    repeatType: 'none'
                }
            ]
        };

        const updateResponse = await axios.put(`${BASE_URL}/api/weeklyGoals/${goalId}`, updateData, { headers });
        console.log('✅ Goal updated successfully');

        // Step 6: Test Goal Deletion
        console.log('6. Testing goal deletion...');
        const deleteResponse = await axios.delete(`${BASE_URL}/api/weeklyGoals/${goalId}`, { headers });
        console.log('✅ Goal deleted successfully');

        console.log('\n🎉 All basic CRUD operations working correctly!');

        // Step 7: Test Error Cases
        console.log('\n7. Testing error cases...');

        // Test empty title
        try {
            await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, {
                title: '',
                weekOf: currentWeek.toISOString()
            }, { headers });
            console.log('❌ Empty title should have failed');
        } catch (error) {
            console.log('✅ Empty title correctly rejected');
        }

        // Test unauthorized request
        try {
            await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, goalData);
            console.log('❌ Unauthorized request should have failed');
        } catch (error) {
            console.log('✅ Unauthorized request correctly rejected');
        }

        // Test invalid goal ID
        try {
            await axios.delete(`${BASE_URL}/api/weeklyGoals/invalid-id`, { headers });
            console.log('❌ Invalid ID should have failed');
        } catch (error) {
            console.log('✅ Invalid ID correctly rejected');
        }

        console.log('\n🎯 Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        console.error('Full error:', error);
    }
}

runSimpleTest();