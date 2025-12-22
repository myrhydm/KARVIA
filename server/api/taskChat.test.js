const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 'nonexistentUserId' };
  next();
});

jest.mock('../models/Task');
jest.mock('../models/User');

const Task = require('../models/Task');
const User = require('../models/User');
const router = require('../routes/taskChat');

describe('POST /api/task-chat/:taskId/interact', () => {
  it('responds with 404 if user not found', async () => {
    const mockTask = { name: 'Test', estTime: 30, day: 'Mon', priority: 'High', completed: false, userFamiliarity: null, goal: null };

    Task.findOne.mockReturnValue({
      populate: function() { return this; },
      then: function(resolve) { return Promise.resolve(mockTask).then(resolve); }
    });

    User.findById.mockResolvedValue(null);

    const app = express();
    app.use(express.json());
    app.use('/api/task-chat', router);

    const res = await request(app)
      .post('/api/task-chat/123/interact')
      .send({ message: 'Hello' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ msg: 'User not found' });
  });
});
