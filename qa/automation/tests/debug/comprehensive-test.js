/**
 * Comprehensive test suite for Goals CRUD operations
 * Tests all scenarios including edge cases and error handling
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const TEST_USER = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'testpass123'
};

class ComprehensiveGoalsTest {
    constructor() {
        this.token = '';
        this.testResults = [];
        this.createdGoals = [];
        this.currentWeek = new Date();
    }

    log(category, status, message, data = null) {
        const result = { category, status, message, timestamp: new Date(), data };
        this.testResults.push(result);
        const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : 'ℹ️';
        console.log(`${emoji} [${category}] ${message}`);
        if (data && status === 'fail') {
            console.log('  Error details:', JSON.stringify(data, null, 2));
        }
    }

    async setup() {
        try {
            // Login
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: TEST_USER.email,
                password: TEST_USER.password
            });
            this.token = loginResponse.data.token;
            this.log('SETUP', 'pass', 'Authentication successful');
            return true;
        } catch (error) {
            this.log('SETUP', 'fail', 'Authentication failed', error.response?.data || error.message);
            return false;
        }
    }

    getHeaders() {
        return { Authorization: `Bearer ${this.token}` };
    }

    // Clean up goals before each test section
    async cleanupGoals() {
        try {
            const response = await axios.get(`${BASE_URL}/api/weeklyGoals?weekOf=${this.currentWeek.toISOString()}`, { headers: this.getHeaders() });
            const goals = response.data;
            
            for (const goal of goals) {
                await axios.delete(`${BASE_URL}/api/weeklyGoals/${goal._id}`, { headers: this.getHeaders() });
            }
        } catch (error) {
            // Continue even if cleanup fails
        }
    }

    // Test 1: Goal Creation Edge Cases
    async testGoalCreationEdgeCases() {
        console.log('\n📝 Testing Goal Creation Edge Cases...');
        await this.cleanupGoals();

        const testCases = [
            // Valid cases
            {
                name: 'Basic goal creation',
                data: { title: 'Test Goal 1', weekOf: this.currentWeek.toISOString() },
                shouldPass: true
            },
            {
                name: 'Goal with very long title',
                data: { title: 'A'.repeat(500), weekOf: this.currentWeek.toISOString() },
                shouldPass: true
            },
            {
                name: 'Goal with special characters',
                data: { title: '🎯 Goal with émojis & special chars!', weekOf: this.currentWeek.toISOString() },
                shouldPass: true
            },
            {
                name: 'Goal with whitespace-only title',
                data: { title: '   ', weekOf: this.currentWeek.toISOString() },
                shouldPass: false
            },
            {
                name: 'Goal with empty title',
                data: { title: '', weekOf: this.currentWeek.toISOString() },
                shouldPass: false
            },
            {
                name: 'Goal with missing title',
                data: { weekOf: this.currentWeek.toISOString() },
                shouldPass: false
            },
            {
                name: 'Goal with invalid weekOf format',
                data: { title: 'Test Goal', weekOf: 'invalid-date' },
                shouldPass: false
            },
            {
                name: 'Goal with missing weekOf',
                data: { title: 'Test Goal' },
                shouldPass: false
            }
        ];

        for (const testCase of testCases) {
            try {
                const response = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, testCase.data, { headers: this.getHeaders() });
                
                if (testCase.shouldPass) {
                    this.log('GOAL_CREATION', 'pass', `${testCase.name}: Created successfully`);
                    this.createdGoals.push(response.data._id);
                } else {
                    this.log('GOAL_CREATION', 'fail', `${testCase.name}: Should have failed but passed`, response.data);
                }
            } catch (error) {
                if (!testCase.shouldPass) {
                    this.log('GOAL_CREATION', 'pass', `${testCase.name}: Correctly rejected`);
                } else {
                    this.log('GOAL_CREATION', 'fail', `${testCase.name}: Unexpectedly failed`, error.response?.data);
                }
            }
        }
    }

    // Test 2: Task Creation Edge Cases
    async testTaskCreationEdgeCases() {
        console.log('\n📋 Testing Task Creation Edge Cases...');
        await this.cleanupGoals();

        const testCases = [
            // Valid cases
            {
                name: 'Basic task creation',
                data: {
                    title: 'Goal with Valid Tasks',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [
                        { name: 'Valid Task 1', estTime: 60, day: 'Mon', repeatType: 'none' },
                        { name: 'Valid Task 2', estTime: 30, day: 'Tue', repeatType: 'daily' }
                    ]
                },
                shouldPass: true
            },
            {
                name: 'Task with minimum time',
                data: {
                    title: 'Goal with Min Time Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: 'Min Time Task', estTime: 1, day: 'Wed', repeatType: 'none' }]
                },
                shouldPass: true
            },
            {
                name: 'Task with maximum realistic time',
                data: {
                    title: 'Goal with Max Time Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: 'Max Time Task', estTime: 480, day: 'Thu', repeatType: 'none' }]
                },
                shouldPass: true
            },
            {
                name: 'Task with very long name',
                data: {
                    title: 'Goal with Long Name Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: 'T'.repeat(1000), estTime: 60, day: 'Fri', repeatType: 'none' }]
                },
                shouldPass: true
            },
            {
                name: 'Task with special characters in name',
                data: {
                    title: 'Goal with Special Char Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: '🚀 Task with émojis & special chars!', estTime: 45, day: 'Sat', repeatType: 'none' }]
                },
                shouldPass: true
            },
            // Invalid cases
            {
                name: 'Task with zero time',
                data: {
                    title: 'Goal with Zero Time Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: 'Zero Time Task', estTime: 0, day: 'Sun', repeatType: 'none' }]
                },
                shouldPass: false
            },
            {
                name: 'Task with negative time',
                data: {
                    title: 'Goal with Negative Time Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: 'Negative Time Task', estTime: -30, day: 'Mon', repeatType: 'none' }]
                },
                shouldPass: false
            },
            {
                name: 'Task with empty name',
                data: {
                    title: 'Goal with Empty Name Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: '', estTime: 60, day: 'Tue', repeatType: 'none' }]
                },
                shouldPass: false
            },
            {
                name: 'Task with whitespace-only name',
                data: {
                    title: 'Goal with Whitespace Name Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: '   ', estTime: 60, day: 'Wed', repeatType: 'none' }]
                },
                shouldPass: false
            },
            {
                name: 'Task with missing name',
                data: {
                    title: 'Goal with Missing Name Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ estTime: 60, day: 'Thu', repeatType: 'none' }]
                },
                shouldPass: false
            },
            {
                name: 'Task with invalid day',
                data: {
                    title: 'Goal with Invalid Day Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: 'Invalid Day Task', estTime: 60, day: 'InvalidDay', repeatType: 'none' }]
                },
                shouldPass: false
            },
            {
                name: 'Task with missing day',
                data: {
                    title: 'Goal with Missing Day Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: 'Missing Day Task', estTime: 60, repeatType: 'none' }]
                },
                shouldPass: false
            },
            {
                name: 'Task with invalid repeatType',
                data: {
                    title: 'Goal with Invalid Repeat Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: 'Invalid Repeat Task', estTime: 60, day: 'Fri', repeatType: 'invalid' }]
                },
                shouldPass: false
            },
            {
                name: 'Task with missing estTime',
                data: {
                    title: 'Goal with Missing Time Task',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [{ name: 'Missing Time Task', day: 'Sat', repeatType: 'none' }]
                },
                shouldPass: false
            }
        ];

        for (const testCase of testCases) {
            try {
                const response = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, testCase.data, { headers: this.getHeaders() });
                
                if (testCase.shouldPass) {
                    this.log('TASK_CREATION', 'pass', `${testCase.name}: Created successfully`);
                    this.createdGoals.push(response.data._id);
                } else {
                    this.log('TASK_CREATION', 'fail', `${testCase.name}: Should have failed but passed`, response.data);
                }
            } catch (error) {
                if (!testCase.shouldPass) {
                    this.log('TASK_CREATION', 'pass', `${testCase.name}: Correctly rejected`);
                } else {
                    this.log('TASK_CREATION', 'fail', `${testCase.name}: Unexpectedly failed`, error.response?.data);
                }
            }
        }
    }

    // Test 3: Goal Update Edge Cases
    async testGoalUpdateEdgeCases() {
        console.log('\n✏️ Testing Goal Update Edge Cases...');
        await this.cleanupGoals();

        try {
            // Create a goal to update
            const createData = {
                title: 'Goal to Update',
                weekOf: this.currentWeek.toISOString(),
                tasks: [
                    { name: 'Original Task', estTime: 60, day: 'Mon', repeatType: 'none' }
                ]
            };
            
            const createResponse = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, createData, { headers: this.getHeaders() });
            const goalId = createResponse.data._id;
            this.createdGoals.push(goalId);

            const testCases = [
                // Valid updates
                {
                    name: 'Update title only',
                    data: { title: 'Updated Goal Title', weekOf: this.currentWeek.toISOString(), tasks: [] },
                    shouldPass: true
                },
                {
                    name: 'Update with new tasks',
                    data: {
                        title: 'Goal with New Tasks',
                        weekOf: this.currentWeek.toISOString(),
                        tasks: [
                            { name: 'New Task 1', estTime: 45, day: 'Tue', repeatType: 'none' },
                            { name: 'New Task 2', estTime: 90, day: 'Wed', repeatType: 'daily' }
                        ]
                    },
                    shouldPass: true
                },
                {
                    name: 'Update with empty tasks array',
                    data: { title: 'Goal with No Tasks', weekOf: this.currentWeek.toISOString(), tasks: [] },
                    shouldPass: true
                },
                // Invalid updates
                {
                    name: 'Update with empty title',
                    data: { title: '', weekOf: this.currentWeek.toISOString(), tasks: [] },
                    shouldPass: false
                },
                {
                    name: 'Update with invalid task data',
                    data: {
                        title: 'Goal with Invalid Task',
                        weekOf: this.currentWeek.toISOString(),
                        tasks: [{ name: '', estTime: 60, day: 'Mon', repeatType: 'none' }]
                    },
                    shouldPass: false
                }
            ];

            for (const testCase of testCases) {
                try {
                    const response = await axios.put(`${BASE_URL}/api/weeklyGoals/${goalId}`, testCase.data, { headers: this.getHeaders() });
                    
                    if (testCase.shouldPass) {
                        this.log('GOAL_UPDATE', 'pass', `${testCase.name}: Updated successfully`);
                    } else {
                        this.log('GOAL_UPDATE', 'fail', `${testCase.name}: Should have failed but passed`, response.data);
                    }
                } catch (error) {
                    if (!testCase.shouldPass) {
                        this.log('GOAL_UPDATE', 'pass', `${testCase.name}: Correctly rejected`);
                    } else {
                        this.log('GOAL_UPDATE', 'fail', `${testCase.name}: Unexpectedly failed`, error.response?.data);
                    }
                }
            }

            // Test updating non-existent goal
            try {
                await axios.put(`${BASE_URL}/api/weeklyGoals/507f1f77bcf86cd799439011`, {
                    title: 'Non-existent Goal',
                    weekOf: this.currentWeek.toISOString(),
                    tasks: []
                }, { headers: this.getHeaders() });
                this.log('GOAL_UPDATE', 'fail', 'Non-existent goal update should have failed');
            } catch (error) {
                this.log('GOAL_UPDATE', 'pass', 'Non-existent goal update correctly rejected');
            }

        } catch (error) {
            this.log('GOAL_UPDATE', 'fail', 'Goal update test setup failed', error.response?.data);
        }
    }

    // Test 4: Task Completion and State Changes
    async testTaskCompletionEdgeCases() {
        console.log('\n✅ Testing Task Completion Edge Cases...');
        await this.cleanupGoals();

        try {
            // Create a goal with tasks
            const createData = {
                title: 'Goal for Task Completion',
                weekOf: this.currentWeek.toISOString(),
                tasks: [
                    { name: 'Task 1', estTime: 60, day: 'Mon', repeatType: 'none' },
                    { name: 'Task 2', estTime: 30, day: 'Tue', repeatType: 'daily' }
                ]
            };
            
            const createResponse = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, createData, { headers: this.getHeaders() });
            const goalId = createResponse.data._id;
            const taskIds = createResponse.data.tasks.map(t => t._id);
            this.createdGoals.push(goalId);

            // Test task completion
            const completionData = {
                title: 'Goal for Task Completion',
                weekOf: this.currentWeek.toISOString(),
                tasks: [
                    { _id: taskIds[0], name: 'Task 1', estTime: 60, day: 'Mon', repeatType: 'none', completed: true },
                    { _id: taskIds[1], name: 'Task 2', estTime: 30, day: 'Tue', repeatType: 'daily', completed: false }
                ]
            };

            const updateResponse = await axios.put(`${BASE_URL}/api/weeklyGoals/${goalId}`, completionData, { headers: this.getHeaders() });
            this.log('TASK_COMPLETION', 'pass', 'Task completion state updated successfully');

            // Test task modification with completion
            const modifyData = {
                title: 'Goal with Modified Tasks',
                weekOf: this.currentWeek.toISOString(),
                tasks: [
                    { _id: taskIds[0], name: 'Modified Task 1', estTime: 90, day: 'Wed', repeatType: 'none', completed: true },
                    { name: 'New Task 3', estTime: 45, day: 'Thu', repeatType: 'none', completed: false }
                ]
            };

            const modifyResponse = await axios.put(`${BASE_URL}/api/weeklyGoals/${goalId}`, modifyData, { headers: this.getHeaders() });
            this.log('TASK_COMPLETION', 'pass', 'Task modification with completion state updated successfully');

        } catch (error) {
            this.log('TASK_COMPLETION', 'fail', 'Task completion test failed', error.response?.data);
        }
    }

    // Test 5: Bulk Operations and Limits
    async testBulkOperations() {
        console.log('\n⚡ Testing Bulk Operations...');
        await this.cleanupGoals();

        try {
            // Create multiple goals to test limits
            const goals = [];
            for (let i = 0; i < 5; i++) {
                const goalData = {
                    title: `Bulk Goal ${i + 1}`,
                    weekOf: this.currentWeek.toISOString(),
                    tasks: []
                };

                // Add tasks to each goal
                for (let j = 0; j < 3; j++) {
                    goalData.tasks.push({
                        name: `Task ${j + 1} for Goal ${i + 1}`,
                        estTime: 30 + (j * 15),
                        day: ['Mon', 'Tue', 'Wed'][j],
                        repeatType: j === 2 ? 'daily' : 'none'
                    });
                }

                const response = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, goalData, { headers: this.getHeaders() });
                goals.push(response.data._id);
                this.createdGoals.push(response.data._id);
            }

            this.log('BULK_OPERATIONS', 'pass', `Created ${goals.length} goals with multiple tasks`);

            // Test retrieving all goals
            const retrieveResponse = await axios.get(`${BASE_URL}/api/weeklyGoals?weekOf=${this.currentWeek.toISOString()}`, { headers: this.getHeaders() });
            const allGoals = retrieveResponse.data;
            this.log('BULK_OPERATIONS', 'pass', `Retrieved ${allGoals.length} goals`);

            // Test concurrent updates
            const updatePromises = goals.slice(0, 3).map(async (goalId, index) => {
                const updateData = {
                    title: `Concurrently Updated Goal ${index + 1}`,
                    weekOf: this.currentWeek.toISOString(),
                    tasks: [
                        { name: `Concurrent Task ${index + 1}`, estTime: 60, day: 'Fri', repeatType: 'none' }
                    ]
                };
                return axios.put(`${BASE_URL}/api/weeklyGoals/${goalId}`, updateData, { headers: this.getHeaders() });
            });

            await Promise.all(updatePromises);
            this.log('BULK_OPERATIONS', 'pass', 'Concurrent updates completed successfully');

        } catch (error) {
            this.log('BULK_OPERATIONS', 'fail', 'Bulk operations test failed', error.response?.data);
        }
    }

    // Test 6: Error Handling and Edge Cases
    async testErrorHandling() {
        console.log('\n🚨 Testing Error Handling...');

        const testCases = [
            // Authentication tests
            {
                name: 'Request without token',
                request: () => axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, { title: 'Test', weekOf: this.currentWeek.toISOString() }),
                shouldFail: true
            },
            {
                name: 'Request with invalid token',
                request: () => axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, 
                    { title: 'Test', weekOf: this.currentWeek.toISOString() },
                    { headers: { Authorization: 'Bearer invalid-token' } }
                ),
                shouldFail: true
            },
            // Malformed requests
            {
                name: 'Request with malformed JSON',
                request: async () => {
                    const response = await fetch(`${BASE_URL}/api/weeklyGoals/addGoal`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.token}`
                        },
                        body: '{"title": "Test", "weekOf": "2023-01-01", malformed}'
                    });
                    if (!response.ok) throw new Error('Request failed');
                    return response.json();
                },
                shouldFail: true
            },
            // Invalid goal ID formats
            {
                name: 'Delete with invalid ObjectId',
                request: () => axios.delete(`${BASE_URL}/api/weeklyGoals/invalid-id`, { headers: this.getHeaders() }),
                shouldFail: true
            },
            {
                name: 'Update with invalid ObjectId',
                request: () => axios.put(`${BASE_URL}/api/weeklyGoals/invalid-id`, 
                    { title: 'Test', weekOf: this.currentWeek.toISOString(), tasks: [] },
                    { headers: this.getHeaders() }
                ),
                shouldFail: true
            }
        ];

        for (const testCase of testCases) {
            try {
                await testCase.request();
                if (testCase.shouldFail) {
                    this.log('ERROR_HANDLING', 'fail', `${testCase.name}: Should have failed but passed`);
                } else {
                    this.log('ERROR_HANDLING', 'pass', `${testCase.name}: Passed as expected`);
                }
            } catch (error) {
                if (testCase.shouldFail) {
                    this.log('ERROR_HANDLING', 'pass', `${testCase.name}: Correctly rejected`);
                } else {
                    this.log('ERROR_HANDLING', 'fail', `${testCase.name}: Unexpectedly failed`, error.response?.data);
                }
            }
        }
    }

    // Test 7: Data Consistency and Validation
    async testDataConsistency() {
        console.log('\n🔍 Testing Data Consistency...');
        await this.cleanupGoals();

        try {
            // Create a goal with tasks
            const createData = {
                title: 'Data Consistency Test',
                weekOf: this.currentWeek.toISOString(),
                tasks: [
                    { name: 'Task 1', estTime: 60, day: 'Mon', repeatType: 'none' },
                    { name: 'Task 2', estTime: 30, day: 'Tue', repeatType: 'daily' }
                ]
            };
            
            const createResponse = await axios.post(`${BASE_URL}/api/weeklyGoals/addGoal`, createData, { headers: this.getHeaders() });
            const goalId = createResponse.data._id;
            this.createdGoals.push(goalId);

            // Verify the created goal has correct structure
            const getResponse = await axios.get(`${BASE_URL}/api/weeklyGoals/${goalId}`, { headers: this.getHeaders() });
            const goal = getResponse.data;

            // Check goal structure
            if (goal._id && goal.title && goal.weekOf && Array.isArray(goal.tasks)) {
                this.log('DATA_CONSISTENCY', 'pass', 'Goal structure is correct');
            } else {
                this.log('DATA_CONSISTENCY', 'fail', 'Goal structure is incorrect', goal);
            }

            // Check task structure
            if (goal.tasks.length === 2) {
                const task1 = goal.tasks[0];
                const task2 = goal.tasks[1];
                
                if (task1.name && task1.estTime && task1.day && task1.repeatType !== undefined) {
                    this.log('DATA_CONSISTENCY', 'pass', 'Task structure is correct');
                } else {
                    this.log('DATA_CONSISTENCY', 'fail', 'Task structure is incorrect', task1);
                }
            } else {
                this.log('DATA_CONSISTENCY', 'fail', 'Incorrect number of tasks created');
            }

            // Test data persistence after update
            const updateData = {
                title: 'Updated Data Consistency Test',
                weekOf: this.currentWeek.toISOString(),
                tasks: [
                    { _id: goal.tasks[0]._id, name: 'Updated Task 1', estTime: 90, day: 'Wed', repeatType: 'none', completed: true }
                ]
            };

            await axios.put(`${BASE_URL}/api/weeklyGoals/${goalId}`, updateData, { headers: this.getHeaders() });
            
            // Verify the update
            const updatedResponse = await axios.get(`${BASE_URL}/api/weeklyGoals/${goalId}`, { headers: this.getHeaders() });
            const updatedGoal = updatedResponse.data;

            if (updatedGoal.title === 'Updated Data Consistency Test' && 
                updatedGoal.tasks.length === 1 && 
                updatedGoal.tasks[0].name === 'Updated Task 1' &&
                updatedGoal.tasks[0].completed === true) {
                this.log('DATA_CONSISTENCY', 'pass', 'Data persistence after update is correct');
            } else {
                this.log('DATA_CONSISTENCY', 'fail', 'Data persistence after update is incorrect', updatedGoal);
            }

        } catch (error) {
            this.log('DATA_CONSISTENCY', 'fail', 'Data consistency test failed', error.response?.data);
        }
    }

    // Cleanup
    async cleanup() {
        console.log('\n🧹 Cleaning up test data...');
        
        let cleaned = 0;
        for (const goalId of this.createdGoals) {
            try {
                await axios.delete(`${BASE_URL}/api/weeklyGoals/${goalId}`, { headers: this.getHeaders() });
                cleaned++;
            } catch (error) {
                // Goal might already be deleted
            }
        }
        
        this.log('CLEANUP', 'pass', `Cleaned up ${cleaned} goals`);
    }

    // Generate comprehensive report
    generateReport() {
        console.log('\n📊 COMPREHENSIVE TEST RESULTS');
        console.log('='.repeat(60));

        const categories = [...new Set(this.testResults.map(r => r.category))];
        const summary = {};

        categories.forEach(category => {
            const categoryResults = this.testResults.filter(r => r.category === category);
            const passed = categoryResults.filter(r => r.status === 'pass').length;
            const failed = categoryResults.filter(r => r.status === 'fail').length;
            const total = categoryResults.length;

            summary[category] = {
                passed,
                failed,
                total,
                rate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0
            };
        });

        console.log('\nResults by Category:');
        Object.entries(summary).forEach(([category, stats]) => {
            console.log(`${category}: ${stats.passed}/${stats.total} (${stats.rate}%)`);
        });

        const totalTests = this.testResults.length;
        const totalPassed = this.testResults.filter(r => r.status === 'pass').length;
        const totalFailed = this.testResults.filter(r => r.status === 'fail').length;

        console.log(`\nOverall: ${totalPassed}/${totalTests} (${((totalPassed / totalTests) * 100).toFixed(1)}%)`);
        console.log(`✅ Passed: ${totalPassed}`);
        console.log(`❌ Failed: ${totalFailed}`);

        if (totalFailed > 0) {
            console.log('\n🚨 FAILED TESTS:');
            this.testResults
                .filter(r => r.status === 'fail')
                .forEach(r => console.log(`  - [${r.category}] ${r.message}`));
        }

        console.log('\n✨ Comprehensive testing completed!');
    }

    // Run all tests
    async runAllTests() {
        console.log('🔬 Starting Comprehensive Goals CRUD Testing\n');

        if (!(await this.setup())) {
            console.log('❌ Setup failed, aborting tests');
            return;
        }

        await this.testGoalCreationEdgeCases();
        await this.testTaskCreationEdgeCases();
        await this.testGoalUpdateEdgeCases();
        await this.testTaskCompletionEdgeCases();
        await this.testBulkOperations();
        await this.testErrorHandling();
        await this.testDataConsistency();
        await this.cleanup();

        this.generateReport();
    }
}

// Run the comprehensive test
const tester = new ComprehensiveGoalsTest();
tester.runAllTests().catch(console.error);