/**
 * Ollama Service - Connect to local Ollama LLM instance
 */

// Dynamic import for node-fetch v3
let fetch;
const getFetch = async () => {
  if (!fetch) {
    fetch = (await import('node-fetch')).default;
  }
  return fetch;
};

class OllamaService {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.defaultModel = process.env.OLLAMA_MODEL || 'llama2';
    }

    /**
     * Check if Ollama is running and accessible
     */
    async isAvailable() {
        try {
            const fetch = await getFetch();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: controller.signal,
                timeout: 5000
            });
            
            clearTimeout(timeout);
            return response.ok;
        } catch (error) {
            console.error('Ollama not available:', error.message);
            return false;
        }
    }

    /**
     * Get list of available models
     */
    async getModels() {
        try {
            const fetch = await getFetch();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: controller.signal,
                timeout: 10000
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            throw error;
        }
    }

    /**
     * Generate text completion using Ollama
     * @param {string} prompt - The prompt to send to the model
     * @param {Object} options - Additional options
     */
    async generateCompletion(prompt, options = {}) {
        const {
            model = this.defaultModel,
            stream = false,
            temperature = 0.7,
            max_tokens = 1000,
            system = null,
            timeout = 120000 // 2 minutes default timeout
        } = options;

        try {
            const payload = {
                model,
                prompt,
                stream,
                options: {
                    temperature,
                    num_predict: max_tokens
                }
            };

            if (system) {
                payload.system = system;
            }

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`Request timeout after ${timeout}ms for model ${model}`);
                controller.abort();
            }, timeout);

            console.log(`Generating completion with model ${model}, prompt length: ${prompt.length}`);
            
            const fetch = await getFetch();
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            console.log(`Completion successful: ${data.response?.length || 0} characters generated`);
            
            return {
                success: true,
                response: data.response,
                model: data.model,
                created_at: data.created_at,
                done: data.done
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error(`Request timed out after ${timeout}ms`);
                return {
                    success: false,
                    error: `Request timed out after ${timeout}ms. Try reducing prompt size or increasing timeout.`
                };
            }
            
            console.error('Error generating completion:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Chat with the model (conversation format)
     * @param {Array} messages - Array of message objects [{role: 'user'|'assistant', content: 'text'}]
     * @param {Object} options - Additional options
     */
    async chat(messages, options = {}) {
        const {
            model = this.defaultModel,
            stream = false,
            temperature = 0.7,
            timeout = 120000
        } = options;

        try {
            const payload = {
                model,
                messages,
                stream,
                options: {
                    temperature
                }
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`Chat request timeout after ${timeout}ms for model ${model}`);
                controller.abort();
            }, timeout);

            const fetch = await getFetch();
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                message: data.message,
                model: data.model,
                created_at: data.created_at,
                done: data.done
            };
        } catch (error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    error: `Chat request timed out after ${timeout}ms`
                };
            }
            
            console.error('Error in chat:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Retry mechanism for failed requests
     */
    async retryRequest(requestFn, maxRetries = 2, delay = 1000) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                const result = await requestFn();
                if (result.success) {
                    return result;
                }
                lastError = result.error;
            } catch (error) {
                lastError = error.message;
                
                // Don't retry on timeout errors
                if (error.name === 'AbortError') {
                    break;
                }
            }
            
            if (i < maxRetries) {
                console.log(`Request failed, retrying in ${delay}ms... (${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 1.5; // Exponential backoff
            }
        }
        
        return {
            success: false,
            error: `Failed after ${maxRetries + 1} attempts: ${lastError}`
        };
    }

    /**
     * Test the connection with a simple prompt
     */
    async testConnection() {
        console.log(`Testing Ollama connection at ${this.baseUrl}...`);
        
        const isAvailable = await this.isAvailable();
        if (!isAvailable) {
            return {
                success: false,
                error: 'Ollama service is not available'
            };
        }

        try {
            const models = await this.getModels();
            console.log(`Available models: ${models.map(m => m.name).join(', ')}`);

            // Use a simple, short test prompt
            const testResult = await this.generateCompletion('Say "Hello!"', {
                max_tokens: 10,
                timeout: 30000 // 30 second timeout for test
            });

            return {
                success: testResult.success,
                models: models.length,
                response: testResult.response,
                error: testResult.error
            };
        } catch (error) {
            return {
                success: false,
                error: `Test connection failed: ${error.message}`
            };
        }
    }
}

module.exports = OllamaService;