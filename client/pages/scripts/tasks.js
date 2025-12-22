/**
 * tasks.js
 * Handles the logic for the task focus timer page.
 */

let taskId;

/**
 * Update the current day and date display for tasks page
 */
function updateCurrentDayDateDisplay() {
    const currentDayDateEl = document.getElementById('current-day-date-task');
    if (!currentDayDateEl) return;
    
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[now.getDay()];
    const date = now.getDate();
    const monthName = monthNames[now.getMonth()];
    
    // Format as "Thu, 17 Jul"
    const formattedDate = `${dayName}, ${date} ${monthName}`;
    currentDayDateEl.textContent = formattedDate;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Ensure we are on the task focus page
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;

    await redirectIfNoToken(); // from utils.js
    
    // Update current day and date display
    updateCurrentDayDateDisplay();

    // --- STATE VARIABLES ---
    const ACTIVE_KEY = 'activeTaskTimer';
    let timerInterval;
    let totalSeconds = 0; // elapsed seconds
    let scheduledSeconds = 0;
    let startTime = null;
    
    // --- DOM ELEMENTS ---
    const taskNameEl = document.getElementById('task-name');
    const taskEstTimeEl = document.getElementById('task-est-time');
    const timerDisplayEl = document.getElementById('timer-display');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const completeBtn = document.getElementById('complete-btn');
    const postponeBtn = document.getElementById('postpone-btn');
    
    // Feedback modal elements
    const completionModal = document.getElementById('completion-modal');
    const valueStars = document.querySelectorAll('.value-star');
    const difficultyBtns = document.querySelectorAll('.difficulty-btn');
    const completionNotes = document.getElementById('completion-notes');
    const skipFeedbackBtn = document.getElementById('skip-feedback-btn');
    const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
    
    let feedbackData = {
        valueRating: null,
        actualDifficulty: null,
        notes: ''
    };
    const actionButtons = document.getElementById('action-buttons');
    const timerControls = document.getElementById('timer-controls');


    // --- TIMER FUNCTIONS ---
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const getElapsed = () => {
        if (timerInterval) {
            return totalSeconds + Math.floor((Date.now() - startTime) / 1000);
        }
        return totalSeconds;
    };

    const updateTimerDisplay = () => {
        const remaining = Math.max(scheduledSeconds - getElapsed(), 0);
        timerDisplayEl.textContent = formatTime(remaining);
    };

    const saveState = (running) => {
        const data = {
            taskId,
            scheduledSeconds,
            totalSeconds,
            startTime,
            running
        };
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(data));
    };

    const tick = () => {
        const now = Date.now();
        const diff = Math.floor((now - startTime) / 1000);
        if (diff > 0) {
            totalSeconds += diff;
            startTime = now;
        }
        updateTimerDisplay();
        if (scheduledSeconds - totalSeconds <= 0) {
            pauseTimer(true);
            updateTimerDisplay();
            localStorage.removeItem(ACTIVE_KEY);
        } else {
            saveState(true);
        }
    };

    const startTimer = () => {
        if (timerInterval) return;
        startTime = Date.now();
        timerInterval = setInterval(tick, 1000);
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        saveState(true);
    };

    const pauseTimer = (autoEnd = false) => {
        if (timerInterval) {
            totalSeconds += Math.floor((Date.now() - startTime) / 1000);
        }
        clearInterval(timerInterval);
        timerInterval = null;
        startTime = null;
        if (!autoEnd) {
            pauseBtn.classList.add('hidden');
            startBtn.classList.remove('hidden');
        } else {
            pauseBtn.classList.add('hidden');
            startBtn.classList.add('hidden');
        }
        saveState(false);
    };

    const resetTimer = () => {
        pauseTimer();
        // Use a custom modal in a real app instead of confirm()
        if (confirm("Are you sure you want to reset the timer?")) {
            totalSeconds = 0;
            startTime = null;
            localStorage.removeItem(ACTIVE_KEY);
            updateTimerDisplay();
        } else {
           // If the timer was running, resume it
           if (!startBtn.classList.contains('hidden')) {
               // Do nothing if it was already paused
           } else {
               startTimer();
           }
        }
    };
    
    // --- TASK CONTEXT FUNCTIONS ---
    const updateTaskContext = (task) => {
        // Update difficulty
        const difficultyEl = document.getElementById('task-difficulty');
        if (difficultyEl) {
            const difficulty = task.difficultyLevel || 'beginner';
            const difficultyIcons = { beginner: '📚', intermediate: '🎯', advanced: '🚀' };
            difficultyEl.textContent = `${difficultyIcons[difficulty]} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
        }
        
        // Update rationale
        const rationaleEl = document.getElementById('task-rationale');
        if (rationaleEl) {
            rationaleEl.textContent = task.rationale || 'This task will help you progress toward your goals.';
        }
        
        // Update metrics impact
        const metricsContainer = document.getElementById('metrics-impact');
        if (metricsContainer) {
            metricsContainer.innerHTML = '';
            
            if (task.metricsImpacted && task.metricsImpacted.length > 0) {
                task.metricsImpacted.forEach(metric => {
                    const metricEl = createMetricImpactElement(metric);
                    metricsContainer.appendChild(metricEl);
                });
            } else {
                metricsContainer.innerHTML = '<div class="col-span-2 text-sm text-gray-500 text-center">Metric impact information will be available for newer tasks.</div>';
            }
        }
        
        // Update goal and skill category
        const goalEl = document.getElementById('task-goal');
        const skillCategoryEl = document.getElementById('task-skill-category');
        
        if (goalEl) {
            goalEl.textContent = task.goalTitle || 'General Progress';
        }
        if (skillCategoryEl) {
            skillCategoryEl.textContent = formatSkillCategory(task.skillCategory || 'general');
        }
        
        // Setup familiarity rating
        setupFamiliarityRating(task);
    };

    const createMetricImpactElement = (metric) => {
        const div = document.createElement('div');
        const impactColors = {
            high: 'bg-green-100 border-green-300 text-green-800',
            medium: 'bg-yellow-100 border-yellow-300 text-yellow-800', 
            low: 'bg-blue-100 border-blue-300 text-blue-800'
        };
        
        const metricIcons = {
            commitment: '🔥',
            clarity: '🔍', 
            growth_readiness: '🌱',
            competency: '🧠',
            opportunity: '📈',
            confidence: '💪',
            mindset: '🧭'
        };
        
        const colorClass = impactColors[metric.expectedImpact] || impactColors.medium;
        
        div.className = `p-3 rounded-lg border ${colorClass}`;
        div.innerHTML = `
            <div class="flex items-center justify-between mb-1">
                <div class="flex items-center">
                    <span class="mr-2">${metricIcons[metric.metric] || '📊'}</span>
                    <span class="font-medium text-sm">${formatMetricName(metric.metric)}</span>
                </div>
                <span class="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 font-medium">
                    ${metric.expectedImpact.toUpperCase()} IMPACT
                </span>
            </div>
            <p class="text-xs opacity-75">${metric.reasoning}</p>
        `;
        
        return div;
    };

    const formatMetricName = (metric) => {
        return metric.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatSkillCategory = (category) => {
        return category.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const setupFamiliarityRating = (task) => {
        const familiaritySection = document.getElementById('familiarity-section');
        const buttons = document.querySelectorAll('.familiarity-btn');
        
        if (!familiaritySection) return;
        
        // Show familiarity section if task doesn't have a rating yet
        if (!task.userFamiliarity) {
            familiaritySection.classList.remove('hidden');
        } else {
            // Hide section if already rated, but show the rating
            familiaritySection.innerHTML = `<span class="text-sm text-gray-600">Your familiarity: <span class="font-medium">${formatFamiliarity(task.userFamiliarity)}</span></span>`;
        }
        
        // Add click handlers for familiarity buttons
        buttons.forEach(button => {
            button.addEventListener('click', async () => {
                const value = button.dataset.value;
                await updateFamiliarityRating(task._id || taskId, value);
                if (familiaritySection) {
                    familiaritySection.innerHTML = `<span class="text-sm text-gray-600">Your familiarity: <span class="font-medium">${formatFamiliarity(value)}</span> ✓</span>`;
                }
            });
        });
    };

    const formatFamiliarity = (familiarity) => {
        const labels = {
            know_this: 'I know this',
            somewhat_familiar: 'Somewhat familiar', 
            no_idea: 'No idea what this is'
        };
        return labels[familiarity] || familiarity;
    };

    const updateFamiliarityRating = async (taskId, familiarity) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/tasks/${taskId}/familiarity`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userFamiliarity: familiarity })
            });
            
            if (!response.ok) {
                console.error('Failed to update familiarity rating');
            }
        } catch (error) {
            console.error('Error updating familiarity rating:', error);
        }
    };

    // --- API CALL FUNCTIONS ---
    const updateTaskStatus = async (status, newDay, feedback = null) => {
        pauseTimer();
        const token = localStorage.getItem('authToken');
        const action = status === 'complete' ? 'completed' : 'postponed';
        try {
            const payload = { timeSpent: Math.round(getElapsed() / 60) };
            if (newDay) payload.newDay = newDay;
            if (feedback) payload.completionFeedback = feedback;
            const response = await fetch(`/api/tasks/${taskId}/${status}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`Failed to mark task as ${action}`);
            
            localStorage.removeItem(ACTIVE_KEY);
            alert(`Task marked as ${action}. Time spent: ${formatTime(getElapsed())}.`);
            // Add timestamp to force cache refresh
            window.location.href = `home.html?refresh=${Date.now()}`;
        } catch (error) {
            console.error(error);
            alert(`Error: Could not update task. Please try again.`);
        }
    };

    // --- INITIALIZATION ---
    const init = async () => {
        console.log('🎯 Frontend Tasks: Initializing task page...');
        
        const params = new URLSearchParams(window.location.search);
        taskId = params.get('taskId');
        const token = localStorage.getItem('authToken');

        console.log('🔍 Frontend Tasks: Initial checks:');
        console.log('   - Task ID from URL:', taskId);
        console.log('   - Auth token exists:', !!token);
        console.log('   - Token preview:', token ? token.substring(0, 20) + '...' : 'N/A');

        // Check if user is authenticated
        if (!token) {
            console.error('❌ Frontend Tasks: No auth token found - redirecting to login');
            taskNameEl.textContent = 'Authentication Required';
            taskEstTimeEl.textContent = 'Please log in to access your tasks.';
            timerControls.classList.add('hidden');
            actionButtons.classList.add('hidden');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                console.log('🔄 Frontend Tasks: Redirecting to login page');
                window.location.href = '/';
            }, 2000);
            return;
        }

        if (!taskId) {
            console.error('❌ Frontend Tasks: No task ID provided in URL');
            taskNameEl.textContent = 'No Task ID Provided';
            taskEstTimeEl.textContent = 'Please return to the dashboard.';
            timerControls.classList.add('hidden');
            actionButtons.classList.add('hidden');
            return;
        }

        try {
            console.log('📡 Frontend Tasks: Making API request...');
            console.log(`   - Endpoint: /api/tasks/${taskId}`);
            console.log(`   - Method: GET`);
            console.log(`   - Headers: Authorization header included`);
            
            // Add loading state
            taskNameEl.textContent = 'Loading Task...';
            taskEstTimeEl.textContent = 'Fetching task details...';
            
            // Fetch the specific task data from the server
            const response = await fetch(`/api/tasks/${taskId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('📨 Frontend Tasks: API response received:');
            console.log('   - Status:', response.status);
            console.log('   - Status Text:', response.statusText);
            console.log('   - OK:', response.ok);
            console.log('   - Headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                    console.error('❌ Frontend Tasks: API error response:', errorData);
                } catch (parseError) {
                    console.error('❌ Frontend Tasks: Failed to parse error response:', parseError);
                    errorData = { msg: `HTTP ${response.status}: ${response.statusText}` };
                }
                
                // Handle specific error cases
                if (response.status === 401) {
                    console.error('🔐 Frontend Tasks: Authentication failed - clearing token and redirecting');
                    localStorage.removeItem('authToken');
                    taskNameEl.textContent = 'Authentication Failed';
                    taskEstTimeEl.textContent = 'Your session has expired. Redirecting to login...';
                    
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                    return;
                } else if (response.status === 404) {
                    throw new Error('Task not found or has been deleted.');
                } else if (response.status === 500) {
                    throw new Error('Server error occurred. Please try again later.');
                } else {
                    throw new Error(errorData.msg || `Server returned error ${response.status}: ${response.statusText}`);
                }
            }
            
            const task = await response.json();
            console.log('✅ Frontend Tasks: Task data received successfully:');
            console.log('   - Task Name:', task.name || task.title);
            console.log('   - Est Time:', task.estTime, 'minutes');
            console.log('   - Day:', task.day);
            console.log('   - Completed:', task.completed);
            console.log('   - Full Task Data:', task);

            // Update task header information
            taskNameEl.textContent = task.name || task.title || 'Untitled Task';
            taskEstTimeEl.textContent = `${task.estTime || 30} minutes`;
            
            // Update new transparent task information
            updateTaskContext(task);
            
            scheduledSeconds = (task.estTime || 60) * 60 - 1;
            totalSeconds = 0;

            const stored = localStorage.getItem(ACTIVE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                if (data.taskId === taskId) {
                    scheduledSeconds = data.scheduledSeconds;
                    totalSeconds = data.totalSeconds;
                    if (data.running) {
                        startTime = data.startTime;
                        timerInterval = setInterval(tick, 1000);
                        startBtn.classList.add('hidden');
                        pauseBtn.classList.remove('hidden');
                    }
                }
            }
            updateTimerDisplay();
            
            console.log('🎯 Frontend Tasks: Task page initialized successfully!');

        } catch (error) {
            console.error('❌ Frontend Tasks: Error in init function:');
            console.error('   - Error Type:', error.name);
            console.error('   - Error Message:', error.message);
            console.error('   - Error Stack:', error.stack);
            
            // Show specific error messages based on error type
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                taskNameEl.textContent = 'Connection Error';
                taskEstTimeEl.textContent = 'Unable to connect to server. Please check your internet connection and try again.';
            } else if (error.message.includes('Task not found')) {
                taskNameEl.textContent = 'Task Not Found';
                taskEstTimeEl.textContent = 'This task may have been deleted. Please return to the dashboard.';
            } else if (error.message.includes('Server error')) {
                taskNameEl.textContent = 'Server Error';
                taskEstTimeEl.textContent = 'The server encountered an error. Please try again in a few minutes.';
            } else {
                taskNameEl.textContent = 'Error Loading Task';
                taskEstTimeEl.textContent = `${error.message} Please try refreshing the page or return to the dashboard.`;
            }
            
            // Hide controls when there's an error
            timerControls.classList.add('hidden');
            actionButtons.classList.add('hidden');
            
            // Add retry button
            const retryButton = document.createElement('button');
            retryButton.textContent = 'Retry Loading Task';
            retryButton.className = 'mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors';
            retryButton.addEventListener('click', () => {
                console.log('🔄 Frontend Tasks: User clicked retry - reinitializing...');
                window.location.reload();
            });
            
            // Add return to dashboard button
            const returnButton = document.createElement('button');
            returnButton.textContent = 'Return to Dashboard';
            returnButton.className = 'mt-2 ml-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors';
            returnButton.addEventListener('click', () => {
                console.log('🏠 Frontend Tasks: User returning to dashboard');
                window.location.href = 'home.html';
            });
            
            const taskContext = document.getElementById('task-context');
            if (taskContext) {
                taskContext.innerHTML = '';
                taskContext.appendChild(retryButton);
                taskContext.appendChild(returnButton);
            }
        }
    };

    // --- FEEDBACK MODAL FUNCTIONS ---
    const showCompletionModal = () => {
        pauseTimer();
        completionModal.classList.remove('hidden');
        resetFeedbackForm();
    };

    const setupFeedbackModalListeners = () => {
        // Value rating stars
        valueStars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.value);
                feedbackData.valueRating = rating;
                updateStarDisplay(rating);
                checkSubmitButton();
            });
        });
        
        // Difficulty buttons
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Clear previous selection
                difficultyBtns.forEach(b => b.classList.remove('bg-blue-100', 'border-blue-500'));
                
                // Set new selection
                btn.classList.add('bg-blue-100', 'border-blue-500');
                feedbackData.actualDifficulty = btn.dataset.value;
                checkSubmitButton();
            });
        });
        
        // Notes textarea
        completionNotes.addEventListener('input', () => {
            feedbackData.notes = completionNotes.value;
        });
        
        // Modal buttons
        skipFeedbackBtn.addEventListener('click', () => {
            completionModal.classList.add('hidden');
            completeTaskWithoutFeedback();
        });
        
        submitFeedbackBtn.addEventListener('click', () => {
            completionModal.classList.add('hidden');
            completeTaskWithFeedback();
        });
    };

    const updateStarDisplay = (rating) => {
        valueStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add('text-yellow-400');
            } else {
                star.classList.remove('text-yellow-400');
                star.classList.add('text-gray-300');
            }
        });
    };

    const checkSubmitButton = () => {
        const hasRating = feedbackData.valueRating !== null;
        const hasDifficulty = feedbackData.actualDifficulty !== null;
        submitFeedbackBtn.disabled = !(hasRating && hasDifficulty);
    };

    const resetFeedbackForm = () => {
        feedbackData = {
            valueRating: null,
            actualDifficulty: null,
            notes: ''
        };
        
        // Reset stars
        valueStars.forEach(star => {
            star.classList.remove('text-yellow-400');
            star.classList.add('text-gray-300');
        });
        
        // Reset difficulty buttons
        difficultyBtns.forEach(btn => {
            btn.classList.remove('bg-blue-100', 'border-blue-500');
        });
        
        // Reset notes
        completionNotes.value = '';
        submitFeedbackBtn.disabled = true;
    };

    const completeTaskWithoutFeedback = async () => {
        await updateTaskStatus('complete');
    };

    const completeTaskWithFeedback = async () => {
        await updateTaskStatus('complete', null, feedbackData);
    };

    // Initialize feedback modal
    setupFeedbackModalListeners();

    // --- EVENT LISTENERS ---
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    completeBtn.addEventListener('click', showCompletionModal);
    postponeBtn.addEventListener('click', () => {
        const dateStr = prompt('Enter date to postpone to (YYYY-MM-DD):');
        if (!dateStr) return;
        const chosen = new Date(dateStr);
        if (isNaN(chosen)) {
            alert('Invalid date');
            return;
        }
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const newDay = days[chosen.getDay()];
        updateTaskStatus('postpone', newDay);
    });

    init();
    
    // Initialize chat functionality
    initializeChatInterface();
});

// === TASK CHAT FUNCTIONALITY ===

/**
 * Initialize the task chat interface
 */
function initializeChatInterface() {
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatPanel = document.getElementById('chat-panel');
    const chatCloseBtn = document.getElementById('chat-close-btn');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');
    chatMessages?.classList.add('space-y-4');
    const suggestedQuestions = document.getElementById('suggested-questions');
    
    let conversationHistory = [];
    let currentTaskContext = null;
    
    // Chat toggle functionality
    chatToggleBtn?.addEventListener('click', () => {
        const isHidden = chatPanel.classList.contains('hidden');
        if (isHidden) {
            chatPanel.classList.remove('hidden');
            if (taskId) {
                initializeChatForTask();
            }
        } else {
            chatPanel.classList.add('hidden');
        }
    });
    
    chatCloseBtn?.addEventListener('click', () => {
        chatPanel.classList.add('hidden');
    });
    
    // Chat input functionality
    chatSendBtn?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    /**
     * Initialize chat when a task is loaded
     */
    async function initializeChatForTask() {
        if (!taskId) return;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/task-chat/${taskId}/context`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                currentTaskContext = await response.json();
                
                // Update chat header
                const chatTaskName = document.getElementById('chat-task-name');
                if (chatTaskName) {
                    chatTaskName.textContent = currentTaskContext.task.name;
                }
                
                // Clear previous messages and show greeting
                chatMessages.innerHTML = '';
                conversationHistory = [];
                
                addChatMessage('assistant', currentTaskContext.greeting);
                
                // Show suggested questions
                displaySuggestedQuestions(currentTaskContext.suggestedQuestions);
                
            } else {
                console.error('Failed to get task context for chat');
            }
        } catch (error) {
            console.error('Error initializing chat:', error);
        }
    }
    
    /**
     * Send a chat message
     */
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || !taskId) return;
        
        // Add user message to chat
        addChatMessage('user', message);
        chatInput.value = '';
        chatSendBtn.disabled = true;
        
        // Add to conversation history
        conversationHistory.push({ role: 'user', content: message });
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/task-chat/${taskId}/interact`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    conversationHistory
                })
            });
            
            if (response.ok) {
                const result = await response.json();

                // Add AI response to chat
                addChatMessage('assistant', result.response);

                // Add to conversation history
                conversationHistory.push({ role: 'assistant', content: result.response });

                // Show suggestions if provided
                if (result.suggestions && result.suggestions.length > 0) {
                    displaySuggestions(result.suggestions);
                }

            } else if (response.status === 401) {
                // Session expired - clear token and redirect to login
                localStorage.removeItem('authToken');
                window.location.href = 'index.html';
            } else {
                let errorMsg = 'Sorry, I encountered an error. Please try again.';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorData.msg || errorMsg;
                } catch (e) {
                    // Ignore JSON parse errors
                }
                addChatMessage('assistant', errorMsg);
            }
        } catch (error) {
            console.error('Chat error:', error);
            addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        } finally {
            chatSendBtn.disabled = false;
        }
    }
    
    /**
     * Add a message to the chat display
     */
    function addChatMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'assistant-message'}`;
        
        if (role === 'user') {
            messageDiv.innerHTML = `
                <div class="flex justify-end">
                    <div class="bg-indigo-600 text-white px-3 py-2 rounded-lg max-w-full text-sm">
                        ${escapeHtml(content)}
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="flex justify-start">
                    <div class="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg max-w-full prose prose-sm space-y-2 leading-relaxed">
                        <div class="flex items-center gap-2 mb-1">
                            <div class="w-2 h-2 bg-indigo-600 rounded-full"></div>
                            <span class="text-xs font-medium text-indigo-600">Assistant</span>
                        </div>
                        ${formatMessage(content)}
                    </div>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    /**
     * Display suggested questions
     */
    function displaySuggestedQuestions(questions) {
        suggestedQuestions.innerHTML = '';
        
        questions.forEach(question => {
            const button = document.createElement('button');
            button.className = 'w-full text-left px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200 truncate';
            button.textContent = question;
            button.addEventListener('click', () => {
                chatInput.value = question;
                sendMessage();
            });
            suggestedQuestions.appendChild(button);
        });
    }
    
    /**
     * Display suggestions from AI response
     */
    function displaySuggestions(suggestions) {
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'mt-2 p-2 bg-blue-50 rounded-lg';
        suggestionsDiv.innerHTML = `
            <div class="text-xs font-medium text-blue-800 mb-1">💡 Suggestions:</div>
            ${suggestions.map(s => `<div class="text-xs text-blue-700">• ${escapeHtml(s)}</div>`).join('')}
        `;
        
        const lastMessage = chatMessages.lastElementChild;
        if (lastMessage) {
            lastMessage.querySelector('.bg-gray-100').appendChild(suggestionsDiv);
        }
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Escape HTML, convert URLs to links, and format basic lists
     */
    function formatMessage(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const escapeAndLink = str => escapeHtml(str).replace(urlRegex, '<a href="$1" target="_blank" class="text-indigo-600 underline">$1</a>');
        const lines = text.split('\n');
        let result = '';
        let inList = false;

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            const isListItem = trimmed.startsWith('-') || trimmed.startsWith('*');

            if (isListItem) {
                if (!inList) {
                    if (index > 0) result += '<br>';
                    result += '<ul class="list-disc pl-4 space-y-1">';
                    inList = true;
                }
                const item = trimmed.substring(1).trim();
                result += `<li>${escapeAndLink(item)}</li>`;
            } else {
                if (inList) {
                    result += '</ul>';
                    inList = false;
                }
                if (index > 0) result += '<br>';
                result += escapeAndLink(line);
            }
        });

        if (inList) {
            result += '</ul>';
        }

        return result;
    }
    
    // Expose function to be called when task is loaded
    window.initializeChatForTask = initializeChatForTask;
}

function createTaskDetailsPanel() {
    const panel = document.createElement('div');
    panel.className = 'task-details-panel bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden transition-all duration-300';
    panel.innerHTML = `
        <div class="details-header bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors duration-200" 
             onclick="toggleTaskDetails()">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Task Details
                </h3>
                <svg id="details-chevron" class="w-5 h-5 text-gray-500 transform transition-transform duration-300" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
        </div>
        
        <div id="details-content" class="details-content hidden">
            <div class="p-4 space-y-4">
                <!-- Task Context Section -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-3">
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <h4 class="font-medium text-blue-900 mb-2 flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                Progress Context
                            </h4>
                            <div id="progress-context" class="text-sm text-blue-800">
                                <div class="flex justify-between items-center mb-1">
                                    <span>Estimated Time:</span>
                                    <span id="task-est-time" class="font-medium">--</span>
                                </div>
                                <div class="flex justify-between items-center mb-1">
                                    <span>Time Spent:</span>
                                    <span id="task-time-spent" class="font-medium">--</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span>Familiarity Level:</span>
                                    <span id="task-familiarity" class="font-medium">--</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-green-50 p-3 rounded-lg">
                            <h4 class="font-medium text-green-900 mb-2 flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                                Smart Suggestions
                            </h4>
                            <div id="task-suggestions" class="text-sm text-green-800 space-y-1">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="bg-purple-50 p-3 rounded-lg">
                            <h4 class="font-medium text-purple-900 mb-2 flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                                Goal Connection
                            </h4>
                            <div id="goal-connection" class="text-sm text-purple-800">
                                <div class="mb-2">
                                    <span class="font-medium">Associated Goal:</span>
                                    <div id="task-goal" class="mt-1">--</div>
                                </div>
                                <div>
                                    <span class="font-medium">Why This Matters:</span>
                                    <div id="task-rationale" class="mt-1 italic">--</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-orange-50 p-3 rounded-lg">
                            <h4 class="font-medium text-orange-900 mb-2 flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                                Contextual Tips
                            </h4>
                            <div id="contextual-tips" class="text-sm text-orange-800">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="border-t border-gray-200 pt-4">
                    <h4 class="font-medium text-gray-900 mb-3">Quick Actions</h4>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="showFamiliarityModal()" 
                                class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200">
                            Update Familiarity
                        </button>
                        <button onclick="toggleChat()" 
                                class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors duration-200">
                            Ask AI Assistant
                        </button>
                        <button onclick="showTaskHistory()" 
                                class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors duration-200">
                            View Progress
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return panel;
}

function toggleTaskDetails() {
    const content = document.getElementById('details-content');
    const chevron = document.getElementById('details-chevron');
    
    if (!content || !chevron) return;
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        chevron.style.transform = 'rotate(180deg)';
        
        // Load task details when expanded for the first time
        if (!content.dataset.loaded) {
            loadEnhancedTaskDetails();
            content.dataset.loaded = 'true';
        }
    } else {
        content.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
    }
}

async function loadEnhancedTaskDetails() {
    try {
        // Use existing taskId variable from tasks.js
        if (!taskId) {
            console.error('No taskId available for enhanced details');
            return;
        }
        
        const response = await fetch(`/api/tasks/${taskId}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Failed to load task details');
        
        const taskData = await response.json();
        populateTaskDetails(taskData);
        
    } catch (error) {
        console.error('Error loading enhanced task details:', error);
        showTaskDetailsError();
    }
}

function populateTaskDetails(task) {
    // Progress Context
    const estTimeEl = document.getElementById('task-est-time');
    const timeSpentEl = document.getElementById('task-time-spent');
    const familiarityEl = document.getElementById('task-familiarity');
    
    if (estTimeEl) estTimeEl.textContent = `${task.estTime} minutes`;
    if (timeSpentEl) timeSpentEl.textContent = `${task.timeSpent || 0} minutes`;
    
    const familiarityMap = {
        'know_this': '🟢 Very Familiar',
        'somewhat_familiar': '🟡 Somewhat Familiar', 
        'no_idea': '🔴 Need Guidance',
        null: '⚫ Not Rated'
    };
    if (familiarityEl) {
        familiarityEl.textContent = familiarityMap[task.userFamiliarity] || familiarityMap[null];
    }
    
    // Smart Suggestions
    const suggestionsContainer = document.getElementById('task-suggestions');
    if (suggestionsContainer && task.computedInsights?.suggestedNextSteps) {
        suggestionsContainer.innerHTML = task.computedInsights.suggestedNextSteps.map(suggestion => 
            `<div class="flex items-start"><span class="text-green-600 mr-2">•</span><span>${suggestion}</span></div>`
        ).join('');
    }
    
    // Goal Connection
    const goalEl = document.getElementById('task-goal');
    const rationaleEl = document.getElementById('task-rationale');
    
    if (goalEl) goalEl.textContent = task.goal?.title || 'No associated goal';
    if (rationaleEl) rationaleEl.textContent = task.rationale || 'No rationale provided';
    
    // Contextual Tips
    const tipsContainer = document.getElementById('contextual-tips');
    if (tipsContainer && task.computedInsights?.contextualTips) {
        tipsContainer.innerHTML = task.computedInsights.contextualTips.map(tip => 
            `<div class="flex items-start"><span class="text-orange-600 mr-2">💡</span><span>${tip}</span></div>`
        ).join('');
    }
}

function showTaskDetailsError() {
    const suggestionsContainer = document.getElementById('task-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.innerHTML = '<div class="text-red-600">Error loading task details. Please refresh the page.</div>';
    }
}

async function showTaskHistory() {
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');

    if (!taskId) {
        alert('No task selected.');
        return;
    }

    const token = localStorage.getItem('authToken');

    try {
        const response = await fetch(`/api/tasks/${taskId}/history`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch task history');
        }

        const history = await response.json();

        let contentHtml;

        const formatDuration = (seconds) => {
            const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            return `${h}:${m}:${s}`;
        };

        if (!history || history.length === 0) {
            contentHtml = '<p class="text-gray-600">No history available for this task yet.</p>';
        } else {
            contentHtml = history.map(entry => {
                const dateStr = new Date(entry.date || entry.completedAt).toLocaleString();
                const timeStr = typeof entry.timeSpent === 'number'
                    ? formatDuration(entry.timeSpent)
                    : entry.timeSpent;
                const notes = entry.notes || entry.completionNotes || 'No notes provided.';
                return `<div class="border-b last:border-b-0 pb-2 mb-2">
                        <div class="font-medium">${dateStr}</div>
                        <div class="text-sm text-gray-700">Time Spent: ${timeStr}</div>
                        <div class="text-sm text-gray-700">Notes: ${notes}</div>
                    </div>`;
            }).join('');
        }

        let modal = document.getElementById('task-history-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'task-history-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 hidden z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg max-w-md w-full p-6">
                    <h3 class="text-xl font-bold text-gray-900 mb-4">Task History</h3>
                    <div id="task-history-content" class="max-h-96 overflow-y-auto"></div>
                    <div class="mt-4 text-right">
                        <button id="history-close-btn" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Close</button>
                    </div>
                </div>`;
            document.body.appendChild(modal);
            modal.querySelector('#history-close-btn').addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }

        modal.querySelector('#task-history-content').innerHTML = contentHtml;
        modal.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading task history:', error);
        alert('Unable to load task history.');
    }
}

