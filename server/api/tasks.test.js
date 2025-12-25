const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set up test environment
process.env.JWT_SECRET = 'test-jwt-secret';

// Import models and routes
const Task = require('../models/Task');
const WeeklyGoal = require('../models/WeeklyGoal');
const User = require('../models/User');
const taskRoutes = require('../routes/tasks');

// Mock auth middleware
jest.mock('../middleware/auth', () => (req, res, next) => {
    req.user = { id: req.headers['x-test-user-id'] };
    next();
});

let mongoServer;
let app;
let testUser;
let testGoal;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());
    app.use('/api/tasks', taskRoutes);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Task.deleteMany({});
    await WeeklyGoal.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
    });

    // Create test goal
    testGoal = await WeeklyGoal.create({
        user: testUser._id,
        title: 'Test Goal',
        weekOf: new Date(),
        tasks: [],
    });
});

describe('POST /api/tasks', () => {
    test('should create a new task with valid data', async () => {
        const taskData = {
            goalId: testGoal._id.toString(),
            name: 'Test Task',
            estTime: 30,
            day: 'Mon',
        };

        const res = await request(app)
            .post('/api/tasks')
            .set('x-test-user-id', testUser._id.toString())
            .send(taskData);

        expect(res.status).toBe(201);
        expect(res.body.name).toBe(taskData.name);
        expect(res.body.estTime).toBe(taskData.estTime);
        expect(res.body.completed).toBe(false);
    });

    test('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('x-test-user-id', testUser._id.toString())
            .send({ goalId: testGoal._id.toString() });

        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('Required fields missing.');
    });

    test('should return 404 if goal not found', async () => {
        const fakeGoalId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .post('/api/tasks')
            .set('x-test-user-id', testUser._id.toString())
            .send({
                goalId: fakeGoalId.toString(),
                name: 'Test Task',
                estTime: 30,
                day: 'Mon',
            });

        expect(res.status).toBe(404);
        expect(res.body.msg).toBe('Goal not found');
    });
});

describe('GET /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
        testTask = await Task.create({
            user: testUser._id,
            goal: testGoal._id,
            name: 'Get Test Task',
            estTime: 45,
            day: 'Tue',
        });
    });

    test('should return task by id', async () => {
        const res = await request(app)
            .get(`/api/tasks/${testTask._id}`)
            .set('x-test-user-id', testUser._id.toString());

        expect(res.status).toBe(200);
        expect(res.body.name).toBe(testTask.name);
        expect(res.body.computedInsights).toBeDefined();
    });

    test('should return 404 if task not found', async () => {
        const fakeTaskId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .get(`/api/tasks/${fakeTaskId}`)
            .set('x-test-user-id', testUser._id.toString());

        expect(res.status).toBe(404);
    });

    test('should return 401 if user not authorized', async () => {
        const otherUser = await User.create({
            name: 'Other User',
            email: 'other@example.com',
            password: 'hashedpassword',
        });

        const res = await request(app)
            .get(`/api/tasks/${testTask._id}`)
            .set('x-test-user-id', otherUser._id.toString());

        expect(res.status).toBe(401);
    });
});

describe('PUT /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
        testTask = await Task.create({
            user: testUser._id,
            goal: testGoal._id,
            name: 'Update Test Task',
            estTime: 30,
            day: 'Wed',
        });
    });

    test('should update task name', async () => {
        const res = await request(app)
            .put(`/api/tasks/${testTask._id}`)
            .set('x-test-user-id', testUser._id.toString())
            .send({ name: 'Updated Task Name' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Task Name');
    });

    test('should update task completion status', async () => {
        const res = await request(app)
            .put(`/api/tasks/${testTask._id}`)
            .set('x-test-user-id', testUser._id.toString())
            .send({ completed: true });

        expect(res.status).toBe(200);
        expect(res.body.completed).toBe(true);
    });

    test('should update multiple fields', async () => {
        const res = await request(app)
            .put(`/api/tasks/${testTask._id}`)
            .set('x-test-user-id', testUser._id.toString())
            .send({
                name: 'Multi Update',
                estTime: 60,
                day: 'Fri',
            });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Multi Update');
        expect(res.body.estTime).toBe(60);
        expect(res.body.day).toBe('Fri');
    });

    test('should return 404 if task not found', async () => {
        const fakeTaskId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .put(`/api/tasks/${fakeTaskId}`)
            .set('x-test-user-id', testUser._id.toString())
            .send({ name: 'Test' });

        expect(res.status).toBe(404);
    });
});

describe('PATCH /api/tasks/:id/complete', () => {
    let testTask;

    beforeEach(async () => {
        testTask = await Task.create({
            user: testUser._id,
            goal: testGoal._id,
            name: 'Complete Test Task',
            estTime: 30,
            day: 'Thu',
            completed: false,
        });
    });

    test('should mark task as completed', async () => {
        const res = await request(app)
            .patch(`/api/tasks/${testTask._id}/complete`)
            .set('x-test-user-id', testUser._id.toString())
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.completed).toBe(true);
    });

    test('should accept time spent on completion', async () => {
        const res = await request(app)
            .patch(`/api/tasks/${testTask._id}/complete`)
            .set('x-test-user-id', testUser._id.toString())
            .send({ timeSpent: 25 });

        expect(res.status).toBe(200);
        expect(res.body.completed).toBe(true);
        expect(res.body.timeSpent).toBe(25);
    });

    test('should accept completion feedback', async () => {
        const res = await request(app)
            .patch(`/api/tasks/${testTask._id}/complete`)
            .set('x-test-user-id', testUser._id.toString())
            .send({
                completionFeedback: {
                    valueRating: 4,
                    actualDifficulty: 'as_expected',
                    notes: 'Good task',
                },
            });

        expect(res.status).toBe(200);
        expect(res.body.completionFeedback.valueRating).toBe(4);
    });
});

describe('PATCH /api/tasks/:id/postpone', () => {
    let testTask;

    beforeEach(async () => {
        testTask = await Task.create({
            user: testUser._id,
            goal: testGoal._id,
            name: 'Postpone Test Task',
            estTime: 30,
            day: 'Mon',
        });
    });

    test('should postpone task to new day', async () => {
        const res = await request(app)
            .patch(`/api/tasks/${testTask._id}/postpone`)
            .set('x-test-user-id', testUser._id.toString())
            .send({ newDay: 'Wed' });

        expect(res.status).toBe(200);
        expect(res.body.day).toBe('Wed');
    });

    test('should return 400 if newDay is missing', async () => {
        const res = await request(app)
            .patch(`/api/tasks/${testTask._id}/postpone`)
            .set('x-test-user-id', testUser._id.toString())
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('New day required to postpone.');
    });
});

describe('PATCH /api/tasks/:id/familiarity', () => {
    let testTask;

    beforeEach(async () => {
        testTask = await Task.create({
            user: testUser._id,
            goal: testGoal._id,
            name: 'Familiarity Test Task',
            estTime: 30,
            day: 'Fri',
        });
    });

    test('should update familiarity rating', async () => {
        const res = await request(app)
            .patch(`/api/tasks/${testTask._id}/familiarity`)
            .set('x-test-user-id', testUser._id.toString())
            .send({ userFamiliarity: 'know_this' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.userFamiliarity).toBe('know_this');
    });

    test('should return 400 for invalid familiarity value', async () => {
        const res = await request(app)
            .patch(`/api/tasks/${testTask._id}/familiarity`)
            .set('x-test-user-id', testUser._id.toString())
            .send({ userFamiliarity: 'invalid_value' });

        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('Invalid familiarity rating');
    });
});
