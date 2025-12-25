/**
 * Update the current day and date display
 */
function updateCurrentDayDateDisplay() {
    const currentDayDateEl = document.getElementById('current-day-date');
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

/**
 * Get AI generation badge with provider-specific information
 */
function getAIGenerationBadge() {
    try {
        const generationData = localStorage.getItem('lastPlanGenerationMethod');
        if (generationData) {
            const { provider, model } = JSON.parse(generationData);
            
            let badgeText = 'AI Generated';
            let badgeColor = 'bg-indigo-100 text-indigo-800';
            let icon = 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';
            
            if (provider === 'openai') {
                badgeText = `✨ AI • ${model || 'GPT'}`;
                badgeColor = 'bg-green-100 text-green-800';
                icon = 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z';
            } else if (provider === 'claude') {
                badgeText = `✨ AI • ${model || 'Claude'}`;
                badgeColor = 'bg-purple-100 text-purple-800';
                icon = 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z';
            } else if (provider === 'llama') {
                badgeText = `✨ AI • ${model || 'LLaMA'}`;
                badgeColor = 'bg-blue-100 text-blue-800';
                icon = 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09z';
            } else {
                badgeText = '📋 Template';
                badgeColor = 'bg-gray-100 text-gray-800';
                icon = 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z';
            }
            
            return `<span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeColor}">
                <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}"/>
                </svg>
                ${badgeText}
            </span>`;
        }
    } catch (error) {
        console.log('Error reading generation method:', error);
    }
    
    // Fallback to generic AI badge
    return `<span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        AI Generated
    </span>`;
}

function displaySavedTasks(card, tasks) {
    const savedContainer = card.querySelector('.saved-tasks-container');
    const tasksList = card.querySelector('.saved-tasks-list');

    // Store tasks data for extraction later
    card.savedTasksData = tasks;

    // Remove the previously counted tasks for this card
    const prevCount = card.savedTaskCount || 0;
    taskCount -= prevCount;
    if (taskCount < 0) taskCount = 0;

    tasksList.innerHTML = tasks.map((task, index) => {
        const timeText = formatTime(task.estTime);
        const dayText = task.repeatType && task.repeatType !== 'none'
            ? `${task.repeatType === 'daily' ? 'Daily' : 'Alternate days'}`
            : formatDayWithDate(task.day);
        const nameClasses = task.completed ? 'line-through text-gray-500' : 'text-gray-900';
        const status = task.completed ?
            '<span class="text-green-600 font-bold ml-2">✓ Done</span>' : '';

        return `
            <li class="flex items-start justify-between">
                <div class="flex items-start">
                    <span class="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                        ${index + 1}
                    </span>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium ${nameClasses} break-words">${task.name}</div>
                        <div class="flex items-center gap-3 mt-1">
                            <span class="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ${timeText}
                            </span>
                            <span class="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                ${dayText}
                            </span>
                        </div>
                    </div>
                </div>
                ${status}
            </li>`;
    }).join('');
    
    savedContainer.classList.remove('hidden');

    // Track new saved task count for this card
    card.savedTaskCount = tasks.length;
    taskCount += tasks.length;
}

function showTaskForm(card) {
    const tasksContainer = card.querySelector('.tasks-container');
    const addTaskForm = card.querySelector('.add-task-form');
    const savedContainer = card.querySelector('.saved-tasks-container');
    
    // Hide saved tasks view and add task button
    savedContainer.classList.add('hidden');
    addTaskForm.classList.add('hidden');
    
    // Show tasks container
    tasksContainer.classList.remove('hidden');
    
    // Add a task if container is empty
    if (tasksContainer.children.length === 0) {
        tasksContainer.insertAdjacentHTML('beforeend', createTaskHtml());
        taskCount++;
    }
    
    // Add cancel and save buttons
    if (!tasksContainer.querySelector('.task-form-actions')) {
        const actions = document.createElement('div');
        actions.className = 'task-form-actions flex gap-2 pt-3 border-t border-gray-200';
        actions.innerHTML = `
            <button type="button" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cancel-tasks-btn">
                Cancel
            </button>
            <button type="button" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 save-tasks-btn">
                Save Tasks
            </button>`;
        tasksContainer.appendChild(actions);
    }
}

function hideTaskForm(card) {
    const tasksContainer = card.querySelector('.tasks-container');
    const addTaskForm = card.querySelector('.add-task-form');
    
    // Clear and hide tasks container
    tasksContainer.innerHTML = '';
    tasksContainer.classList.add('hidden');
    
    // Show add task button
    addTaskForm.classList.remove('hidden');

    delete card.dataset.mode;
}

function handleShowTaskForm(btn) {
    const card = btn.closest('.goal-card');
    card.dataset.mode = 'add';
    showTaskForm(card);
    markGoalModified(card);
}

function handleEditTasks(btn) {
    const card = btn.closest('.goal-card');
    card.dataset.mode = 'edit';
    const savedTasks = card.savedTasksData || [];

    showTaskForm(card);

    // Populate form with existing tasks
    const tasksContainer = card.querySelector('.tasks-container');
    tasksContainer.innerHTML = ''; // Clear existing

    savedTasks.forEach(task => {
        tasksContainer.insertAdjacentHTML('beforeend', createTaskHtml(task));
    });

    // Add form actions
    const actions = document.createElement('div');
    actions.className = 'task-form-actions flex gap-2 pt-3 border-t border-gray-200';
    actions.innerHTML = `
        <button type="button" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cancel-tasks-btn">
            Cancel
        </button>
        <button type="button" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 save-tasks-btn">
            Save Tasks
        </button>`;
    tasksContainer.appendChild(actions);

    markGoalModified(card);
}

async function handleSaveTasks(btn) {
    const card = btn.closest('.goal-card');
    const tasksContainer = card.querySelector('.tasks-container');
    let tasks = [];
    
    // Extract tasks from form
    tasksContainer.querySelectorAll('.task-input-group').forEach(taskGroup => {
        const name = taskGroup.querySelector('input[type="text"]').value.trim();
        if (name) {
            const selects = taskGroup.querySelectorAll('select');
            const estTime = parseInt(selects[0].value, 10);
            const day = selects[1].value;
            const repeatType = taskGroup.querySelector('.repeat-select').value;

            tasks.push({
                _id: taskGroup.dataset.id || undefined,
                completed: taskGroup.dataset.completed === 'true',
                name,
                estTime,
                day,
                isRepeat: repeatType !== 'none',
                repeatType
            });
        }
    });
    
    if (tasks.length === 0) {
        showError('Please add at least one task before saving.');
        return;
    }

    // If we are adding tasks to existing ones, merge them
    if (card.dataset.mode === 'add' && Array.isArray(card.savedTasksData)) {
        tasks = card.savedTasksData.concat(tasks);
    }
    
    const goalId = card.dataset.goalId;
    if (goalId) {
        const token = localStorage.getItem('authToken');
        const title = card.querySelector('.goal-title').value.trim();
        try {
            const res = await fetch(`/api/weeklyGoals/${goalId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, tasks })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Failed to update goal');

            storeOriginalGoalData(goalId, { title, tasks });
        } catch (err) {
            showError(err.message);
            return;
        }
    }

    // Display saved tasks and reload from backend
    displaySavedTasks(card, tasks);
    hideTaskForm(card);
    markGoalModified(card);
    updateAnalytics();
    if (goalId) {
        await fetchExistingGoals(goalId);
    }
}

async function handleCancelTasks(btn) {
    const card = btn.closest('.goal-card');
    const savedContainer = card.querySelector('.saved-tasks-container');
    const tasksContainer = card.querySelector('.tasks-container');
    const addTaskForm = card.querySelector('.add-task-form');

    if (savedContainer.classList.contains('hidden')) {
        // No saved tasks, keep the add button visible
        hideTaskForm(card);
    } else {
        // Has saved tasks, show them again
        tasksContainer.innerHTML = '';
        tasksContainer.classList.add('hidden');
        savedContainer.classList.remove('hidden');
        addTaskForm.classList.remove('hidden');
    }
    updateUI();
    const goalId = card.dataset.goalId;
    if (goalId) {
        await fetchExistingGoals(goalId);
    }
}
function updateAddGoalButtonState() {
    const addBtn = document.getElementById('add-goal-btn');
    if (!addBtn) return;
    if (goalCount >= GOAL_LIMIT) {
        addBtn.setAttribute('disabled', 'disabled');
        addBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        addBtn.removeAttribute('disabled');
        addBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}/**
 * Enhanced goals.js with proper change tracking and selective updates
 */
let GOAL_LIMIT = 50;
let TASK_LIMIT = 200;

let goalCount = 0;
let taskCount = 0;
let originalGoalsData = new Map(); // Track original state for comparison

// Analytics functions
function updateAnalytics() {
    let totalTime = 0;
    const dayTasks = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
    
    // Get tasks from both saved tasks and form inputs
    document.querySelectorAll('.goal-card').forEach(card => {
        const goalData = extractGoalData(card);
        
        goalData.tasks.forEach(task => {
            if (task.name.trim()) {
                const time = task.estTime || 0;
                const repeatType = task.repeatType || 'none';
                
                if (repeatType !== 'none') {
                    Object.keys(dayTasks).forEach(d => {
                        dayTasks[d].push({ time, name: task.name });
                        totalTime += time;
                    });
                } else {
                    const day = task.day;
                    dayTasks[day].push({ time, name: task.name });
                    totalTime += time;
                }
            }
        });
    });

    document.getElementById('total-time').textContent = formatHours(totalTime);
    
    const activeDays = Object.values(dayTasks).filter(tasks => tasks.length > 0).length;
    const avgDaily = activeDays > 0 ? totalTime / activeDays : 0;
    document.getElementById('avg-daily-load').textContent = formatHours(avgDaily);
    
    let maxDay = '';
    let maxTime = 0;
    Object.entries(dayTasks).forEach(([day, tasks]) => {
        const dayTotal = tasks.reduce((sum, task) => sum + task.time, 0);
        if (dayTotal > maxTime) {
            maxTime = dayTotal;
            maxDay = day;
        }
    });
    document.getElementById('max-load-day').textContent = maxDay || '-';
    
    const totalTasksCount = Object.values(dayTasks).reduce((sum, tasks) => sum + tasks.length, 0);
    document.getElementById('total-tasks').textContent = totalTasksCount;
    
    const maxDayTime = Math.max(...Object.values(dayTasks).map(tasks => 
        tasks.reduce((sum, task) => sum + task.time, 0)
    ), 1);
    
    Object.entries(dayTasks).forEach(([day, tasks]) => {
        const dayTotal = tasks.reduce((sum, task) => sum + task.time, 0);
        const percentage = (dayTotal / maxDayTime) * 100;
        const dayLower = day.toLowerCase();
        
        document.getElementById(`${dayLower}-bar`).style.width = `${percentage}%`;
        document.getElementById(`${dayLower}-count`).textContent = formatHours(dayTotal);
    });
}

function formatTime(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatHours(minutes) {
    const hrs = minutes / 60;
    return `${hrs % 1 === 0 ? hrs.toFixed(0) : hrs.toFixed(1)} hr`;
}

function showError(message) {
    const errorText = document.getElementById('error-text');
    const errorMessageDiv = document.getElementById('error-message');
    if (errorText && errorMessageDiv) {
        errorText.textContent = message;
        errorMessageDiv.classList.remove('hidden');
    }
}

function hideError() {
    const errorMessageDiv = document.getElementById('error-message');
    if (errorMessageDiv) errorMessageDiv.classList.add('hidden');
}

// Enhanced change tracking functions
function storeOriginalGoalData(goalId, data) {
    originalGoalsData.set(goalId, JSON.stringify(data));
}

function hasGoalChanged(card) {
    const goalId = card.dataset.goalId;
    if (!goalId) return true; // New goal, definitely changed
    
    const currentData = extractGoalData(card);
    const originalData = originalGoalsData.get(goalId);
    
    if (!originalData) return true; // No original data, treat as changed
    
    return JSON.stringify(currentData) !== originalData;
}

function extractGoalData(card) {
    const title = card.querySelector('.goal-title').value.trim();
    const tasks = [];
    
    // Check if we have saved tasks or form tasks
    const savedTasksList = card.querySelector('.saved-tasks-list');
    const savedContainer = card.querySelector('.saved-tasks-container');
    
    if (savedContainer && !savedContainer.classList.contains('hidden') && savedTasksList) {
        // Extract from saved tasks view - we need to store task data
        if (card.savedTasksData) {
            return { title, tasks: card.savedTasksData };
        }
    }
    
    // Extract from form inputs
    card.querySelectorAll('.task-input-group').forEach(taskGroup => {
        const name = taskGroup.querySelector('input[type="text"]').value.trim();
        if (name) {
            const selects = taskGroup.querySelectorAll('select');
            const estTime = parseInt(selects[0].value, 10);
            const day = selects[1].value;
            const repeatType = taskGroup.querySelector('.repeat-select').value;

            tasks.push({
                _id: taskGroup.dataset.id || undefined,
                completed: taskGroup.dataset.completed === 'true',
                name,
                estTime,
                day,
                isRepeat: repeatType !== 'none',
                repeatType
            });
        }
    });
    
    return { title, tasks };
}

function markGoalModified(card) {
    if (card) {
        card.dataset.modified = 'true';
        // Add visual indicator for modified goals
        const header = card.querySelector('.goal-header');
        if (header && !header.querySelector('.modified-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'modified-indicator w-2 h-2 bg-orange-400 rounded-full animate-pulse';
            indicator.title = 'This goal has unsaved changes';
            header.appendChild(indicator);
        }
    }
}

function clearModifiedState(card) {
    if (card) {
        delete card.dataset.modified;
        const indicator = card.querySelector('.modified-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Fetch goal and task limits from the backend
async function loadLimits() {
    try {
        const res = await fetch('/api/config/limits');
        if (res.ok) {
            const data = await res.json();
            if (data.goalLimit) GOAL_LIMIT = data.goalLimit;
            if (data.taskLimit) TASK_LIMIT = data.taskLimit;
        }
    } catch (err) {
        console.error('Error fetching limits:', err);
    }
}

let currentWeekStart;

function getSelectedWeekStartDate() {
    const stored = localStorage.getItem('selectedWeekOf');
    if (stored) {
        const date = new Date(stored);
        // Validate that the date is actually valid
        if (!isNaN(date.getTime())) {
            return date;
        }
        // If invalid date in localStorage, clear it
        console.warn('Invalid date in localStorage selectedWeekOf:', stored);
        localStorage.removeItem('selectedWeekOf');
    }
    const def = getStartOfWeek(new Date());
    localStorage.setItem('selectedWeekOf', def.toISOString());
    return def;
}

function isSelectedWeekInPast() {
    const selected = getSelectedWeekStartDate();
    const current = getStartOfWeek(new Date());
    return selected < current;
}

function isSelectedWeekCurrentOrFuture() {
    const selected = getSelectedWeekStartDate();
    const current = getStartOfWeek(new Date());
    return selected >= current;
}

function generateWeekOptions() {
    const select = document.getElementById('week-selector');
    if (!select) return;
    const base = getStartOfWeek(new Date());
    const selected = getSelectedWeekStartDate();
    select.innerHTML = '';
    for (let i = -3; i <= 3; i++) {
        const start = new Date(base);
        start.setDate(start.getDate() + i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const opt = document.createElement('option');
        opt.value = start.toISOString();
        opt.textContent = `${formatDate(start)} - ${formatDate(end)}`;
        if (start.toISOString() === selected.toISOString()) {
            opt.selected = true;
        }
        select.appendChild(opt);
    }
}

// DOM ready handler
document.addEventListener('DOMContentLoaded', async () => {
    const goalsForm = document.getElementById('weekly-goals-form');
    if (!goalsForm) return;
    await redirectIfNoToken();

    // Update current day and date display
    updateCurrentDayDateDisplay();

    currentWeekStart = getSelectedWeekStartDate();
    generateWeekOptions();

    await loadLimits();

    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
    }

    const goalsContainer = document.getElementById('goals-container');
    const addGoalBtn = document.getElementById('add-goal-btn');
    const weekSelector = document.getElementById('week-selector');

    if (weekSelector) {
        weekSelector.addEventListener('change', () => {
            currentWeekStart = new Date(weekSelector.value);
            localStorage.setItem('selectedWeekOf', weekSelector.value);
            showWeekRange();
            refreshDaySelects(); // Update all day dropdowns with new week dates
            fetchExistingGoals();
        });
    }

    showWeekRange();

    // Event delegation with proper change tracking
    goalsContainer.addEventListener('click', (e) => {
        // Prevent any editing actions for past weeks or journey goals
        const card = e.target.closest('.goal-card');
        const isJourneyGoal = card && card.dataset.goalId === 'journey-goal';
        if (isSelectedWeekInPast() || isJourneyGoal) {
            return;
        }
        
        const addTaskBtn = e.target.closest('.add-task-icon');
        const removeTaskBtn = e.target.closest('.remove-task-icon');
        const removeGoalBtn = e.target.closest('.remove-goal-icon');
        const showTaskFormBtn = e.target.closest('.show-task-form-btn');
        const editTasksBtn = e.target.closest('.edit-tasks-btn');
        const saveTasksBtn = e.target.closest('.save-tasks-btn');
        const cancelTasksBtn = e.target.closest('.cancel-tasks-btn');

        if (addTaskBtn) handleAddTask(addTaskBtn);
        if (removeTaskBtn) handleRemoveTask(removeTaskBtn);
        if (removeGoalBtn) handleRemoveGoal(removeGoalBtn);
        if (showTaskFormBtn) handleShowTaskForm(showTaskFormBtn);
        if (editTasksBtn) handleEditTasks(editTasksBtn);
        if (saveTasksBtn) handleSaveTasks(saveTasksBtn);
        if (cancelTasksBtn) handleCancelTasks(cancelTasksBtn);
    });

    // Handle repeat select changes
    goalsContainer.addEventListener('change', (e) => {
        // Prevent any editing actions for past weeks
        if (isSelectedWeekInPast()) {
            e.preventDefault();
            return;
        }
        
        if (e.target.classList.contains('repeat-select')) {
            handleRepeatChange(e.target);
        }
        
        // Mark goal as modified when any field changes
        const card = e.target.closest('.goal-card');
        if (card) {
            markGoalModified(card);
        }
        updateAnalytics();
    });

    // Handle input changes (typing in text fields)
    goalsContainer.addEventListener('input', (e) => {
        // Prevent any editing actions for past weeks
        if (isSelectedWeekInPast()) {
            e.preventDefault();
            return;
        }
        
        const card = e.target.closest('.goal-card');
        if (card) {
            markGoalModified(card);
        }
        updateAnalytics();
    });

    addGoalBtn.addEventListener('click', () => {
        if (isSelectedWeekInPast()) {
            return;
        }
        addGoalCard();
    });
    
    goalsForm.addEventListener('submit', (e) => {
        if (isSelectedWeekInPast()) {
            e.preventDefault();
            return;
        }
        handleFormSubmit(e);
    });

    // Update button visibility based on plan state
    updateButtonVisibility();

    fetchExistingGoals().then(() => {
        // Refresh day selects after goals are loaded to show proper dates
        setTimeout(refreshDaySelects, 100);
    });
});

function showWeekRange() {
    const start = getSelectedWeekStartDate();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const display = document.getElementById('week-display');
    if (display) {
        const dateRange = `${formatDate(start)} - ${formatDate(end)}`;
        const isPast = isSelectedWeekInPast();
        display.innerHTML = isPast 
            ? `${dateRange} <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ml-2"><svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Read Only</span>`
            : dateRange;
    }
}

// Prevent duplicate calls within short time window
let lastFetchTime = 0;
let lastFetchUrl = '';

async function fetchExistingGoals(goalId) {
    const token = localStorage.getItem('authToken');
    let fetchedTaskCount = 0;
    try {
        const selected = getSelectedWeekStartDate();
        
        // Add validation to ensure selected is a valid date
        if (!selected || isNaN(selected.getTime())) {
            console.error('🚨 Invalid selected date in fetchExistingGoals:', selected);
            throw new Error('Invalid date for fetching goals');
        }
        
        const url = goalId
            ? `/api/weeklyGoals/${goalId}`
            : `/api/weeklyGoals?weekOf=${encodeURIComponent(selected.toISOString())}`;
        
        // Prevent duplicate calls within 2 seconds
        const now = Date.now();
        if (now - lastFetchTime < 2000 && lastFetchUrl === url) {
            return;
        }
        lastFetchTime = now;
        lastFetchUrl = url;
        
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        // Handle authentication errors
        if (handleAuthError(res, data)) {
            return;
        }
        
        if (!res.ok) throw new Error(data.msg || 'Failed to load goals');

        if (goalId) {
            const goal = data;
            fetchedTaskCount = Array.isArray(goal.tasks) ? goal.tasks.length : 0;
            const card = document.querySelector(`.goal-card[data-goal-id="${goalId}"]`);
            if (card) {
                card.querySelector('.goal-title').value = goal.title || '';
                displaySavedTasks(card, goal.tasks || []);
                hideTaskForm(card);
                storeOriginalGoalData(goalId, { title: goal.title, tasks: goal.tasks || [] });
                clearModifiedState(card);
            }
        } else {
            originalGoalsData.clear();
            if (Array.isArray(data)) {
                fetchedTaskCount = data.reduce((sum, g) => sum + (Array.isArray(g.tasks) ? g.tasks.length : 0), 0);

                const container = document.getElementById('goals-container');
                if (container) container.innerHTML = '';

                data.forEach(goal => {
                    addGoalCard(goal);
                    if (goal._id) {
                        storeOriginalGoalData(goal._id, {
                            title: goal.title,
                            tasks: goal.tasks || []
                        });
                    }
                });
            }
        }
    } catch (err) {
        console.error('Error fetching goals:', err);
        showError('Failed to load existing goals. Please refresh the page.');
    } finally {
        goalCount = document.querySelectorAll('.goal-card').length;
        taskCount = fetchedTaskCount;
        if (goalCount === 0) addGoalCard();
        updateUI();
    }
}

/**
 * Refresh all day select dropdowns to show current week dates
 */
function refreshDaySelects() {
    document.querySelectorAll('.date-pill select').forEach(select => {
        const currentValue = select.value;
        const newOptions = generateDayOptionsWithDates(currentValue);
        select.innerHTML = newOptions;
    });
}

/**
 * Convert day name to "Mon, 17 Jul" format for the selected week
 */
function formatDayWithDate(dayName) {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayIndex = dayNames.indexOf(dayName);
    if (dayIndex === -1) return dayName; // Return original if not found
    
    // Get the selected week start date
    const weekStart = getSelectedWeekStartDate();
    
    // Calculate the date for this day of the week
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayIndex);
    
    const date = dayDate.getDate();
    const monthName = monthNames[dayDate.getMonth()];
    
    // Format as "Mon, 17 Jul"
    return `${dayName}, ${date} ${monthName}`;
}

/**
 * Generate day options with dates for the selected week
 */
function generateDayOptionsWithDates(selectedDay = 'Mon') {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get the selected week start date
    const weekStart = getSelectedWeekStartDate();
    
    return dayNames.map((dayName, index) => {
        // Calculate the date for this day of the week
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + index);
        
        const date = dayDate.getDate();
        const monthName = monthNames[dayDate.getMonth()];
        
        // Format as "Mon, 17 Jul"
        const displayText = `${dayName}, ${date} ${monthName}`;
        
        return `<option value="${dayName}" ${dayName === selectedDay ? 'selected' : ''}>${displayText}</option>`;
    }).join('');
}

// Enhanced task HTML creation with proper repeat handling
function createTaskHtml(task = {}) {
    const { _id = '', completed = false, name = '', estTime = 30, day = 'Mon', repeatType = 'none' } = task;
    const timeOptions = [30, 60, 90, 120, 180, 240];
    const repeatOptions = ['none', 'daily', 'alternate'];
    
    const timeSelect = timeOptions.map(v => {
        const display = v >= 60 ? `${Math.floor(v/60)}h${v%60 > 0 ? ` ${v%60}m` : ''}` : `${v}m`;
        return `<option value="${v}" ${v === estTime ? 'selected' : ''}>${display}</option>`;
    }).join('');
    
    // Generate day options with dates within the selected week range
    const daySelect = generateDayOptionsWithDates(day);
    
    const repeatSelect = repeatOptions.map(r => {
        const display = r === 'none' ? 'No repeat' : r === 'daily' ? 'Daily' : 'Alternate days';
        return `<option value="${r}" ${r === repeatType ? 'selected' : ''}>${display}</option>`;
    }).join('');
    
    const repeatClass = (repeatType !== 'none') ? 'repeat-task' : '';
    const daySelectDisabled = (repeatType !== 'none') ? 'disabled' : '';
    const daySelectOpacity = (repeatType !== 'none') ? 'opacity-50' : '';
    
    return `
    <div class="task-input-group ${repeatClass} mb-3 p-3 bg-white border-2 border-gray-100 rounded-lg hover:border-gray-200 transition-all duration-200" data-id="${_id}" data-completed="${completed}">
        <!-- Task Name - Full Width Text Box -->
        <div class="mb-3">
            <input type="text" value="${name}" placeholder="What do you want to accomplish?"
                   class="block w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-300 transition-all duration-200" required>
        </div>
        
        <!-- All Controls in One Line -->
        <div class="flex items-center justify-between gap-2">
            <div class="task-controls-wrapper">
                <!-- Time Pill -->
                <div class="control-pill time-pill">
                    <svg class="h-3 w-3 text-purple-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <select class="pill-select text-purple-700" title="Duration">
                        ${timeSelect}
                    </select>
                </div>
                
                <!-- Date Pill -->
                <div class="control-pill date-pill ${daySelectOpacity}">
                    <svg class="h-3 w-3 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <select class="pill-select text-green-700" ${daySelectDisabled} title="Day">
                        ${daySelect}
                    </select>
                </div>
                
                <!-- Repeat Pill -->
                <div class="control-pill repeat-pill">
                    <svg class="h-3 w-3 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    <select class="pill-select text-blue-700 repeat-select" title="Repeat pattern">
                        ${repeatSelect}
                    </select>
                </div>
            </div>
            
            <!-- Delete Button - Right Side -->
            <button type="button" class="control-pill delete-pill remove-task-icon flex-shrink-0" title="Delete this task">
                <svg class="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    </div>`;
}

// -------- Goal and Task Management --------

function addGoalCard(goal = {}) {
    if (goalCount >= GOAL_LIMIT) {
        showError(`You can only plan up to ${GOAL_LIMIT} goals.`);
        return;
    }
    hideError();
    const container = document.getElementById('goals-container');
    if (!container) return;

    const isPastWeek = isSelectedWeekInPast();
    const isJourneyGoal = goal._id === 'journey-goal';
    const isLocked = isPastWeek || isJourneyGoal;
    
    const card = document.createElement('div');
    card.className = `goal-card bg-white rounded-2xl p-6 mb-6 w-full overflow-hidden border border-gray-200 shadow-sm ${isPastWeek ? 'bg-gray-50' : ''} ${isJourneyGoal ? 'border-indigo-300 bg-indigo-50' : ''}`;
    if (goal._id) {
        card.dataset.goalId = goal._id;
    } else {
        // Mark new goals as modified
        card.dataset.modified = 'true';
    }

    const header = document.createElement('div');
    header.className = 'goal-header flex items-start justify-between mb-4';
    header.innerHTML = `
        <div class="flex items-center flex-1">
            <div class="p-2 rounded-full ${isJourneyGoal ? 'bg-indigo-100' : 'bg-yellow-100'}">
                ${isJourneyGoal 
                    ? `<svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                       </svg>`
                    : `<svg class="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                       </svg>`
                }
            </div>
            ${isLocked 
                ? `<div class="ml-3 flex-1 font-bold text-gray-800 py-2">${goal.title || 'Untitled Goal'}${isJourneyGoal ? getAIGenerationBadge() : ''}</div>`
                : `<input type="text" class="goal-title form-input ml-3 flex-1 font-bold text-gray-800 bg-transparent border-0 border-b border-gray-300 focus:border-indigo-500 focus:ring-0" placeholder="Goal title" value="${goal.title || ''}" required>`
            }
        </div>
        ${isLocked ? '' : `
        <div class="goal-actions flex gap-2 ml-3">
            <button type="button" class="icon-btn add add-task-icon" title="Add task">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </button>
            <button type="button" class="icon-btn remove remove-goal-icon" title="Remove goal">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>`}`;
    card.appendChild(header);

    // Saved Tasks Display (appears when tasks are saved)
    const savedTasksContainer = document.createElement('div');
    savedTasksContainer.className = 'saved-tasks-container mb-4 hidden';
    savedTasksContainer.innerHTML = `
        <div class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center mb-3">
                <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <svg class="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h4 class="font-medium text-gray-800">${isLocked ? 'Tasks' : 'Saved Tasks'}</h4>
                ${isLocked ? '' : `
                <button type="button" class="ml-auto text-gray-400 hover:text-gray-600 edit-tasks-btn" title="Edit tasks">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>`}
            </div>
            <ol class="saved-tasks-list space-y-2"></ol>
        </div>`;
    card.appendChild(savedTasksContainer);

    // Task Input Container (for adding/editing tasks)
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container space-y-3';
    card.appendChild(tasksContainer);

    // Add Task Form (initially hidden if there are saved tasks)
    const addTaskForm = document.createElement('div');
    addTaskForm.className = 'add-task-form';
    if (!isLocked) {
        addTaskForm.innerHTML = `
            <button type="button" class="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors duration-200 show-task-form-btn">
                <svg class="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span class="text-sm font-medium">Add Task</span>
            </button>`;
    }
    card.appendChild(addTaskForm);

    // Load existing tasks
    if (goal.tasks && Array.isArray(goal.tasks) && goal.tasks.length > 0) {
        // Show saved tasks view
        displaySavedTasks(card, goal.tasks);
        hideTaskForm(card);
    } else {
        // Show task input form
        showTaskForm(card);
    }

    container.appendChild(card);
    goalCount++;
    
    // If it's a new goal (no _id), show the modified indicator
    if (!goal._id) {
        markGoalModified(card);
    }
    
    updateUI();
}


function handleAddTask(btn) {
    if (taskCount >= TASK_LIMIT) {
        showError(`You can only plan up to ${TASK_LIMIT} tasks.`);
        return;
    }
    hideError();
    const card = btn.closest('.goal-card');
    const list = card.querySelector('.tasks-container');
    list.insertAdjacentHTML('beforeend', createTaskHtml());
    taskCount++;
    markGoalModified(card);
    updateUI();
}

function handleRemoveTask(btn) {
    const group = btn.closest('.task-input-group');
    if (!group) return;
    const card = btn.closest('.goal-card');
    group.remove();
    taskCount--;
    markGoalModified(card);
    if (taskCount < 0) taskCount = 0;
    updateUI();
}

async function handleRemoveGoal(btn) {
    const card = btn.closest('.goal-card');
    if (!card) return;
    const savedLen = Array.isArray(card.savedTasksData) ? card.savedTasksData.length : 0;
    const formLen = card.querySelectorAll('.task-input-group').length;
    const tasksRemoved = savedLen > 0 ? savedLen : formLen;

    // If this goal was in the original data, we need to delete it from server
    const goalId = card.dataset.goalId;
    if (goalId && originalGoalsData.has(goalId)) {
        const success = await deleteGoalFromServer(goalId);
        if (!success) {
            showError('Failed to delete goal. Please try again.');
            return;
        }
    }

    card.remove();
    goalCount--;
    taskCount -= tasksRemoved;
    if (taskCount < 0) taskCount = 0;
    if (goalCount <= 0) {
        goalCount = 0;
        addGoalCard();
    }
    updateUI();
    await fetchExistingGoals();
}

async function deleteGoalFromServer(goalId) {
    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch(`/api/weeklyGoals/${goalId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            console.error('Failed to delete goal from server');
            return false;
        }
        originalGoalsData.delete(goalId);
        return true;
    } catch (err) {
        console.error('Error deleting goal:', err);
        return false;
    }
}

function updateButtonVisibility() {
    const saveBtn = document.querySelector('button[type="submit"]');
    const addGoalBtn = document.getElementById('add-goal-btn');
    const isPastWeek = isSelectedWeekInPast();

    if (saveBtn) {
        if (isPastWeek) {
            saveBtn.style.display = 'none';
        } else {
            saveBtn.style.display = 'inline-flex';
            const label = saveBtn.querySelector('svg + *');
            if (label) label.textContent = 'Save';
        }
    }
    
    if (addGoalBtn) {
        if (isPastWeek) {
            addGoalBtn.style.display = 'none';
        } else {
            addGoalBtn.style.display = 'inline-flex';
        }
    }
}

// Call this function whenever goals are added, removed, or modified
function updateUI() {
    updateAddGoalButtonState();
    updateAllAddTaskButtons();
    updateAnalytics();
    updateButtonVisibility();
}

function updateAllAddTaskButtons() {
    const buttons = document.querySelectorAll('.add-task-icon');
    buttons.forEach(btn => {
        if (taskCount >= TASK_LIMIT) {
            btn.setAttribute('disabled', 'disabled');
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btn.removeAttribute('disabled');
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });
}

// Enhanced form submission - intelligently save/update goals
async function handleFormSubmit(e) {
    e.preventDefault();
    hideError();

    // ensure selected week is stored
    const selectedWeek = getSelectedWeekStartDate();

    const saveBtn = e.target.querySelector('button[type="submit"]');
    if (saveBtn) {
        saveBtn.setAttribute('disabled', 'disabled');
        saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
        const label = saveBtn.querySelector('svg + *');
        if (label) label.textContent = 'Saving...';
    }

    const token = localStorage.getItem('authToken');
    const cards = document.querySelectorAll('.goal-card');

    // Check if this is a completely new plan (no existing goals) or mixed
    const hasExistingGoals = Array.from(cards).some(card => card.dataset.goalId);

    try {
        if (!hasExistingGoals) {
            // This is a completely new weekly plan - use the batch create endpoint
            await handleNewWeeklyPlan(token, cards, selectedWeek);
        } else {
            // Mixed scenario - some existing, some new - use selective save/update
            await handleMixedSave(token, cards, selectedWeek);
        }
    } finally {
        if (saveBtn) {
            saveBtn.removeAttribute('disabled');
            saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            const label = saveBtn.querySelector('svg + *');
            if (label) label.textContent = 'Save';
        }
    }
}

async function handleNewWeeklyPlan(token, cards, weekOf) {
    const goals = [];
    
    for (const card of cards) {
        const goalData = extractGoalData(card);
        if (goalData.title.trim()) {
            goals.push(goalData);
        }
    }

    if (goals.length === 0) {
        showError('Please add at least one goal with a title.');
        return;
    }
    try {
        const res = await fetch('/api/weeklyGoals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ weekOf: weekOf.toISOString(), goals })
        });
        const data = await res.json();
        
        // Handle authentication errors
        if (handleAuthError(res, data)) {
            return;
        }
        
        if (!res.ok) throw new Error(data.msg || 'Failed to save weekly goals');
        
        alert('Weekly plan saved successfully');
        localStorage.setItem('weeklyPlanMessage', 'Weekly plan created.');
        await fetchExistingGoals();
        window.location.href = 'home.html';
    } catch (err) {
        showError(err.message);
    }
}

async function handleMixedSave(token, cards, weekOf) {
    let savedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    try {
        for (const card of cards) {
            const goalData = extractGoalData(card);
            
            if (!goalData.title.trim()) {
                skippedCount++;
                continue;
            }

            if (card.dataset.goalId) {
                // This is an existing goal - only update if changed
                if (hasGoalChanged(card)) {
                    const res = await fetch(`/api/weeklyGoals/${card.dataset.goalId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(goalData)
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.msg || 'Failed to update goal');
                    
                    storeOriginalGoalData(card.dataset.goalId, goalData);
                    clearModifiedState(card);
                    updatedCount++;
                } else {
                    // Goal exists but hasn't changed, skip it
                    skippedCount++;
                }
            } else {
                // This is a new goal - save it
                const res = await fetch('/api/weeklyGoals/addGoal', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(Object.assign({ weekOf: weekOf.toISOString() }, goalData))
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Failed to add goal');
                }

                // Ensure the returned object contains an id before updating
                if (!data || !data._id) {
                    throw new Error('Server did not return a valid goal object');
                }

                card.dataset.goalId = data._id;
                storeOriginalGoalData(data._id, goalData);
                clearModifiedState(card);
                savedCount++;
            }
        }

        // Provide detailed feedback
        let message = '';
        const parts = [];
        if (savedCount > 0) parts.push(`saved ${savedCount} new goal(s)`);
        if (updatedCount > 0) parts.push(`updated ${updatedCount} goal(s)`);
        if (skippedCount > 0) parts.push(`skipped ${skippedCount} unchanged goal(s)`);
        
        if (parts.length === 0) {
            message = 'No changes to save.';
        } else {
            message = `Successfully ${parts.join(', ')}.`;
        }

        alert(`Weekly plan saved! ${message}`);
        localStorage.setItem('weeklyPlanMessage', 'Weekly plan saved.');
        await fetchExistingGoals();
        window.location.href = 'home.html';
    } catch (err) {
        showError(err.message);
    }
}


function handleRepeatChange(select) {
    const group = select.closest('.task-input-group');
    const daySelect = group.querySelector('.date-pill select');
    const datePill = group.querySelector('.date-pill');
    
    if (select.value === 'none') {
        daySelect.removeAttribute('disabled');
        datePill.classList.remove('opacity-50');
        group.classList.remove('repeat-task');
    } else {
        daySelect.setAttribute('disabled', 'disabled');
        datePill.classList.add('opacity-50');
        group.classList.add('repeat-task');
    }
}