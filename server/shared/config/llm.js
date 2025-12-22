/**
 * LLM Configuration
 * ENV-based configuration for different LLM providers
 */

const LLM_PROVIDERS = {
  LLAMA: 'llama',
  OPENAI: 'openai', 
  CLAUDE: 'claude',
  GEMINI: 'gemini'
};

const getLLMConfig = () => {
  const provider = process.env.LLM_PROVIDER || LLM_PROVIDERS.OPENAI;
  
  const configs = {
    [LLM_PROVIDERS.LLAMA]: {
      provider: 'llama',
      apiUrl: process.env.LLM_API_URL || 'http://localhost:11434',
      model: process.env.LLM_MODEL || 'llama3.1:8b',
      endpoint: '/api/generate',
      timeout: parseInt(process.env.LLM_TIMEOUT) || 30000,
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7
    },
    
    [LLM_PROVIDERS.OPENAI]: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      timeout: parseInt(process.env.LLM_TIMEOUT) || 30000,
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7
    },
    
    [LLM_PROVIDERS.CLAUDE]: {
      provider: 'claude',
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.LLM_MODEL || 'claude-3-haiku-20240307',
      timeout: parseInt(process.env.LLM_TIMEOUT) || 30000,
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7
    },
    
    [LLM_PROVIDERS.GEMINI]: {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.LLM_MODEL || 'gemini-1.5-flash',
      timeout: parseInt(process.env.LLM_TIMEOUT) || 30000,
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7
    }
  };
  
  const config = configs[provider];
  if (!config) {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }
  
  return config;
};

module.exports = {
  LLM_PROVIDERS,
  getLLMConfig
};