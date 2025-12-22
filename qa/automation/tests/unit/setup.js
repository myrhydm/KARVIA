const path = require('path');

// Location of the cached MongoDB binaries used by mongodb-memory-server
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(__dirname, 'mongo-binaries');

// Pin a specific MongoDB version so the cached binary can be prepacked
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '6.0.5';

// Ensure tests use the OpenAI provider to avoid Ollama routing
process.env.LLM_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
