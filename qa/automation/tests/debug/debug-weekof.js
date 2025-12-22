/**
 * Debug weekOf validation by sending specific requests
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const TEST_USER = {
    email: 'testuser@example.com',
    password: 'testpass123'
};

async function debugWeekOf() {
    try {
        // Login
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
        const token = loginResponse.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        console.log('Testing missing weekOf...');
        try {
            const response = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, {
                title: 'Test Goal Missing WeekOf'
            }, { headers });
            console.log('Response:', response.data);
        } catch (error) {
            console.log('Error:', error.response?.data);
        }

        console.log('\nTesting null weekOf...');
        try {
            const response = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, {
                title: 'Test Goal Null WeekOf',
                weekOf: null
            }, { headers });
            console.log('Response:', response.data);
        } catch (error) {
            console.log('Error:', error.response?.data);
        }

        console.log('\nTesting empty string weekOf...');
        try {
            const response = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, {
                title: 'Test Goal Empty WeekOf',
                weekOf: ''
            }, { headers });
            console.log('Response:', response.data);
        } catch (error) {
            console.log('Error:', error.response?.data);
        }

    } catch (error) {
        console.error('Debug failed:', error.response?.data || error.message);
    }
}

debugWeekOf();