const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => (req, res, next) => {
  req.user = { id: 'testUserId' };
  next();
});

jest.mock('../models/Task');
jest.mock('../models/User');
jest.mock('../models/TaskChatLog');
jest.mock('../services/llamaService');

const Task = require('../models/Task');
const User = require('../models/User');
const TaskChatLog = require('../models/TaskChatLog');
const llamaService = require('../services/llamaService');
const router = require('../routes/taskChat');

describe('Task chat logging', () => {
  it('saves interactions to TaskChatLog', async () => {
    const mockTask = { name: 'Test', estTime: 30, day: 'Mon', priority: 'low', completed: false, userFamiliarity: null, metricsImpacted: [] };
    Task.findOne.mockReturnValue({
      populate() { return this; },
      then(resolve) { return Promise.resolve(mockTask).then(resolve); }
    });

    const findChain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([])
    };
    Task.find.mockReturnValue(findChain);

    User.findById.mockResolvedValue({ overallObjective: 'Objective', archetype: 'career' });
    llamaService.generateChatResponse.mockResolvedValue({ success: true, response: 'AI reply' });
    TaskChatLog.create.mockResolvedValue({});

    const app = express();
    app.use(express.json());
    app.use('/api/task-chat', router);

    const res = await request(app)
      .post('/api/task-chat/task123/interact')
      .send({ message: 'Hello' });

    expect(res.status).toBe(200);
    expect(TaskChatLog.create).toHaveBeenCalledWith({
      task: 'task123',
      user: 'testUserId',
      message: 'Hello',
      aiResponse: 'AI reply'
    });
  });
});
