/**
 * Ollama Testing Interface
 * Client-side script to test Ollama LLM integration
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize authentication check
    await redirectIfNoToken();

    // Initialize all event listeners
    initializeEventListeners();
});

function initializeEventListeners() {
    // Status check
    document.getElementById('check-status-btn').addEventListener('click', checkOllamaStatus);
    
    // Fetch models
    document.getElementById('fetch-models-btn').addEventListener('click', fetchAvailableModels);
    
    // Generate text
    document.getElementById('generate-btn').addEventListener('click', generateText);
    
    // Analyze goals
    document.getElementById('analyze-goals-btn').addEventListener('click', analyzeGoals);
}

async function checkOllamaStatus() {
    const button = document.getElementById('check-status-btn');
    const resultDiv = document.getElementById('status-result');
    
    button.disabled = true;
    button.textContent = 'Checking...';
    
    try {
        const response = await fetch('/api/ollama/status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        
        resultDiv.innerHTML = `
            <div class="p-4 rounded-md ${data.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
                <h3 class="text-lg font-semibold ${data.available ? 'text-green-800' : 'text-red-800'} mb-2">
                    ${data.available ? '✅ Ollama is Available' : '❌ Ollama Not Available'}
                </h3>
                ${data.available ? `
                    <p class="text-green-700 mb-2">Models available: ${data.models}</p>
                    <p class="text-green-700">Test response: "${data.response}"</p>
                ` : `
                    <p class="text-red-700">Error: ${data.error}</p>
                    <p class="text-red-600 text-sm mt-2">Make sure Ollama is running on http://localhost:11434</p>
                `}
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error checking status:', error);
        resultDiv.innerHTML = `
            <div class="p-4 rounded-md bg-red-50 border border-red-200">
                <h3 class="text-lg font-semibold text-red-800 mb-2">❌ Connection Error</h3>
                <p class="text-red-700">Failed to connect to server: ${error.message}</p>
            </div>
        `;
        resultDiv.classList.remove('hidden');
    } finally {
        button.disabled = false;
        button.textContent = 'Check Ollama Status';
    }
}

async function fetchAvailableModels() {
    const button = document.getElementById('fetch-models-btn');
    const resultDiv = document.getElementById('models-result');
    
    button.disabled = true;
    button.textContent = 'Fetching...';
    
    try {
        const response = await fetch('/api/ollama/models', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.models) {
            const modelSelect = document.getElementById('model-select');
            
            // Clear and populate model dropdown
            modelSelect.innerHTML = '';
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = `${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`;
                modelSelect.appendChild(option);
            });
            
            resultDiv.innerHTML = `
                <div class="p-4 rounded-md bg-blue-50 border border-blue-200">
                    <h3 class="text-lg font-semibold text-blue-800 mb-2">📋 Available Models</h3>
                    <ul class="text-blue-700 space-y-1">
                        ${data.models.map(model => `
                            <li>• ${model.name} - ${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB</li>
                        `).join('')}
                    </ul>
                </div>
            `;
        } else {
            throw new Error(data.error || 'Failed to fetch models');
        }
        
        resultDiv.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error fetching models:', error);
        resultDiv.innerHTML = `
            <div class="p-4 rounded-md bg-red-50 border border-red-200">
                <h3 class="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
                <p class="text-red-700">${error.message}</p>
            </div>
        `;
        resultDiv.classList.remove('hidden');
    } finally {
        button.disabled = false;
        button.textContent = 'Fetch Models';
    }
}

async function generateText() {
    const button = document.getElementById('generate-btn');
    const resultDiv = document.getElementById('generation-result');
    const outputDiv = document.getElementById('generation-output');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    const prompt = document.getElementById('prompt-input').value.trim();
    const model = document.getElementById('model-select').value;
    const temperature = parseFloat(document.getElementById('temperature-input').value);
    const maxTokens = parseInt(document.getElementById('max-tokens-input').value);
    
    if (!prompt) {
        alert('Please enter a prompt');
        return;
    }
    
    button.disabled = true;
    button.textContent = 'Generating...';
    loadingOverlay.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/ollama/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                prompt,
                model,
                temperature,
                max_tokens: maxTokens
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            outputDiv.textContent = data.response;
            resultDiv.classList.remove('hidden');
        } else {
            throw new Error(data.error || 'Generation failed');
        }
        
    } catch (error) {
        console.error('Error generating text:', error);
        outputDiv.textContent = `Error: ${error.message}`;
        resultDiv.classList.remove('hidden');
    } finally {
        button.disabled = false;
        button.textContent = 'Generate';
        loadingOverlay.classList.add('hidden');
    }
}

async function analyzeGoals() {
    const button = document.getElementById('analyze-goals-btn');
    const resultDiv = document.getElementById('analysis-result');
    const outputDiv = document.getElementById('analysis-output');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    const goalsText = document.getElementById('goals-input').value.trim();
    const contextText = document.getElementById('context-input').value.trim();
    
    if (!goalsText) {
        alert('Please enter some goals to analyze');
        return;
    }
    
    // Parse goals from text
    const goals = goalsText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(goal => ({
            title: goal,
            description: goal
        }));
    
    button.disabled = true;
    button.textContent = 'Analyzing...';
    loadingOverlay.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/ollama/analyze-goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                goals,
                userContext: contextText || undefined
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            outputDiv.textContent = data.analysis;
            resultDiv.classList.remove('hidden');
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
        
    } catch (error) {
        console.error('Error analyzing goals:', error);
        outputDiv.textContent = `Error: ${error.message}`;
        resultDiv.classList.remove('hidden');
    } finally {
        button.disabled = false;
        button.textContent = 'Analyze Goals with LLM';
        loadingOverlay.classList.add('hidden');
    }
}