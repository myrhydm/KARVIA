/**
 * LLM Service (Standalone version for KARVIA)
 * Provides OpenAI/Ollama integration for content generation
 */

const { getLLMConfig } = require('../shared/config/llm');
let OpenAI;

class LLMService {
    constructor() {
        this.config = getLLMConfig();
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        this.defaultModel = this.config.model || 'gpt-4o-mini';

        // Initialize on first use
        console.log('🔄 Config reloaded - API Key ends with:',
            this.config.apiKey ? this.config.apiKey.slice(-10) : 'not set');
        console.log('LLM Service initialized with provider:', this.config.provider);
    }

    /**
     * Generate content using configured LLM provider
     */
    async generateContent(prompt, options = {}) {
        const { maxTokens = 1000, temperature = 0.7 } = options;

        try {
            if (this.config.provider === 'openai') {
                return await this.generateWithOpenAI(prompt, { maxTokens, temperature });
            } else {
                return await this.generateWithOllama(prompt, { maxTokens, temperature });
            }
        } catch (error) {
            console.error('LLM generation error:', error.message);
            return {
                success: false,
                error: error.message,
                content: null
            };
        }
    }

    /**
     * Generate with OpenAI
     */
    async generateWithOpenAI(prompt, options = {}) {
        if (!OpenAI) {
            OpenAI = require('openai');
        }

        const client = new OpenAI({
            apiKey: this.config.apiKey
        });

        const response = await client.chat.completions.create({
            model: this.config.model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7
        });

        return {
            success: true,
            content: response.choices[0].message.content,
            model: response.model,
            provider: 'openai'
        };
    }

    /**
     * Generate with Ollama (local)
     */
    async generateWithOllama(prompt, options = {}) {
        const axios = require('axios');

        const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
            model: this.defaultModel,
            prompt: prompt,
            stream: false,
            options: {
                temperature: options.temperature || 0.7,
                num_predict: options.maxTokens || 1000
            }
        }, {
            timeout: 180000
        });

        return {
            success: true,
            content: response.data.response,
            model: response.data.model,
            provider: 'ollama'
        };
    }

    /**
     * Test connection to LLM provider
     */
    async testConnection() {
        try {
            if (this.config.provider === 'openai') {
                if (!this.config.apiKey) {
                    return { success: false, error: 'No API key configured', provider: 'openai' };
                }

                // Quick test with minimal tokens
                const result = await this.generateContent('Say "ok"', { maxTokens: 10 });
                return {
                    success: result.success,
                    provider: 'openai',
                    model: this.config.model
                };
            } else {
                const axios = require('axios');
                const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
                return {
                    success: response.status === 200,
                    provider: 'ollama',
                    model: this.defaultModel
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                provider: this.config.provider
            };
        }
    }
}

// Export singleton instance
const llmService = new LLMService();
module.exports = llmService;
