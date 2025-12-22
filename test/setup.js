const path = require('path');
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, 'mongo-binaries');
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '6.0.5';
process.env.LLM_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
