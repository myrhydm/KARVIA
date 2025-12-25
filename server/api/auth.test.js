const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Set up test environment
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRATION = '1h';

// Import models and routes
const User = require('../models/User');
const authRoutes = require('../routes/auth');

// Mock tracking utils to avoid external dependencies
jest.mock('../utils/trackingUtils', () => ({
    trackAuth: jest.fn().mockResolvedValue(undefined),
    trackTaskGoal: jest.fn().mockResolvedValue(undefined),
}));

// Mock default journey tasks
jest.mock('../config/defaultJourneyTasks', () => []);

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe('POST /api/auth/signup', () => {
    const validUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
    };

    test('should create a new user with valid data', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send(validUser);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.name).toBe(validUser.name);
        expect(res.body.onboardingCompleted).toBe(false);

        // Verify user was created in database
        const user = await User.findOne({ email: validUser.email });
        expect(user).toBeTruthy();
        expect(user.name).toBe(validUser.name);
    });

    test('should return 400 if name is missing', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].msg).toBe('Name is required');
    });

    test('should return 400 if email is invalid', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ name: 'Test', email: 'invalid-email', password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.errors[0].msg).toBe('Please include a valid email');
    });

    test('should return 400 if password is too short', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ name: 'Test', email: 'test@example.com', password: '12345' });

        expect(res.status).toBe(400);
        expect(res.body.errors[0].msg).toBe('Please enter a password with 6 or more characters');
    });

    test('should return 400 if user already exists', async () => {
        // Create user first
        await request(app).post('/api/auth/signup').send(validUser);

        // Try to create same user again
        const res = await request(app)
            .post('/api/auth/signup')
            .send(validUser);

        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('User already exists');
    });

    test('should hash the password before storing', async () => {
        await request(app).post('/api/auth/signup').send(validUser);

        const user = await User.findOne({ email: validUser.email });
        expect(user.password).not.toBe(validUser.password);

        const isMatch = await bcrypt.compare(validUser.password, user.password);
        expect(isMatch).toBe(true);
    });

    test('should return a valid JWT token', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send(validUser);

        const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
        expect(decoded.user).toHaveProperty('id');
    });
});

describe('POST /api/auth/login', () => {
    const testUser = {
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'password123',
    };

    beforeEach(async () => {
        // Create a user to test login
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testUser.password, salt);

        await User.create({
            name: testUser.name,
            email: testUser.email,
            password: hashedPassword,
            onboardingCompleted: false,
        });
    });

    test('should login successfully with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.name).toBe(testUser.name);
    });

    test('should return 400 with invalid email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrong@example.com', password: testUser.password });

        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('Invalid Credentials');
    });

    test('should return 400 with invalid password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'wrongpassword' });

        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('Invalid Credentials');
    });

    test('should return 400 if email format is invalid', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'not-an-email', password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
    });

    test('should return 400 if password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email });

        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
    });

    test('should increment login count on new day login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        expect(res.status).toBe(200);

        const user = await User.findOne({ email: testUser.email });
        expect(user.loginCount).toBeGreaterThanOrEqual(1);
        expect(user.lastLogin).toBeDefined();
    });
});
