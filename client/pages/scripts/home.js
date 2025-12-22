/**
 * home.js - Immersive Focus Dashboard
 * Enhanced home page with focus-driven experience
 */

let currentWeekStart;
let focusTimer;
let weeklyGoalsData = [];

/**
 * Update the current day and date display for home page
 */
function updateCurrentDayDateDisplay() {
    const todayDateEl = document.getElementById('today-date');
    if (!todayDateEl) return;
    
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[now.getDay()];
    const date = now.getDate();
    const monthName = monthNames[now.getMonth()];
    
    // Format as "Thu, 17 Jul"
    const formattedDate = `${dayName}, ${date} ${monthName}`;
    todayDateEl.textContent = formattedDate;
}

document.addEventListener('DOMContentLoaded', async () => {
    await redirectIfNoToken();
    currentWeekStart = getStartOfWeek(new Date());
    
    // Update current day and date display
    updateCurrentDayDateDisplay();
    
    // Initialize immersive home experience
    initializeImmersiveHome();
    
    // Load user data and dashboard
    updateUserGreeting();
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize Plan My Week section
    initializePlanMyWeek();
});

function initializeImmersiveHome() {
    // Add floating animations to key elements
    addFloatingAnimations();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup scroll animations
    setupScrollAnimations();
    
    // Initialize progress ring animation
    initializeProgressRing();
}

function setupEventListeners() {
    // Logout buttons
    const logoutBtns = document.querySelectorAll('#logout-button, #mobile-logout-button');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        });
    });
    
    // Start Focus Button
    const startFocusBtn = document.getElementById('start-focus-btn');
    if (startFocusBtn) {
        startFocusBtn.addEventListener('click', startFocusSession);
    }
    
    // Add reflection functionality
    const addReflectionBtn = document.getElementById('add-reflection-btn');
    if (addReflectionBtn) {
        addReflectionBtn.addEventListener('click', openReflectionModal);
    }
    setupReflectionModal();

    const viewBacklogBtn = document.getElementById('view-backlog-btn');
    if (viewBacklogBtn) viewBacklogBtn.addEventListener('click', openBacklogModal);
    setupBacklogModal();

    // Mobile navigation
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
    const closeMobileMenu = document.getElementById('close-mobile-menu');
    
    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            mobileMenu.classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('mobile-menu-panel').classList.remove('translate-x-full');
            }, 10);
        });
        
        [mobileMenuBackdrop, closeMobileMenu].forEach(el => {
            if (el) {
                el.addEventListener('click', () => {
                    document.getElementById('mobile-menu-panel').classList.add('translate-x-full');
                    setTimeout(() => {
                        mobileMenu.classList.add('hidden');
                    }, 300);
                });
            }
        });
    }
}

function setupMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        // Add touch gestures for mobile menu
        let startX = 0;
        const panel = document.getElementById('mobile-menu-panel');
        
        panel.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        panel.addEventListener('touchmove', (e) => {
            const currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            
            if (diff > 50) { // Swipe right to close
                document.getElementById('mobile-menu-panel').classList.add('translate-x-full');
                setTimeout(() => mobileMenu.classList.add('hidden'), 300);
            }
        });
    }
}

function setupScrollAnimations() {
    // Smooth scroll to sections
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            document.querySelector('section:nth-child(2)').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }
    
    // Parallax effects on scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const parallax = document.querySelector('.animate-float');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });
}

function addFloatingAnimations() {
    // Add staggered animations to task cards
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-fade-in-up');
    });
}

function initializeProgressRing() {
    const progressCircle = document.getElementById('progress-circle');
    if (progressCircle) {
        // Set initial state
        progressCircle.style.strokeDashoffset = '314';
    }
}

function updateUserGreeting() {
    const userNameElement = document.getElementById('user-name');
    const userName = localStorage.getItem('userName') || 'Champion';
    
    if (userNameElement) {
        userNameElement.textContent = userName;
    }
    
    // Update focus subtitle based on time of day
    const hour = new Date().getHours();
    const focusSubtitle = document.getElementById('focus-subtitle');
    
    let subtitle;
    if (hour < 12) {
        subtitle = 'Your morning focus awaits';
    } else if (hour < 18) {
        subtitle = 'Your afternoon focus session';
    } else {
        subtitle = 'Your evening focus time';
    }
    
    if (focusSubtitle) {
        focusSubtitle.textContent = subtitle;
    }
}

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('authToken');
        const today = new Date();
        const query = new URLSearchParams({
            weekOf: currentWeekStart.toISOString(),
            day: getDayString(today),
            date: today.toISOString()
        });
        
        const response = await fetch(`/api/home?${query.toString()}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
            }
        });
        
        const data = await response.json();
        weeklyGoalsData = data.weeklyGoals || [];

        // Handle authentication errors
        if (handleAuthError(response, data)) {
            return;
        }

        if (!response.ok) {
            throw new Error(data.msg || 'Failed to fetch dashboard data.');
        }
        
        console.log('Frontend Home: Received dashboard data:', data);
        console.log('Frontend Home: Today\'s tasks:', data.todaysTasks);
        console.log('Frontend Home: Number of today\'s tasks:', data.todaysTasks?.length || 0);

        if (data.weekOf) {
            currentWeekStart = new Date(data.weekOf);
        }

        // Populate all sections
        console.log('Frontend Home: Data received from server:', data);
        console.log('Frontend Home: Weekly goals from server:', data.weeklyGoals);
        populateTodaysFocus(data.todaysTasks);
        populateWeeklyGoals(data.weeklyGoals);
        populateAnalytics(data);
        updateProgressRing(data);

    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showErrorState();
    }
}

function populateTodaysFocus(tasks = []) {
    console.log('Frontend Home: populateTodaysFocus called with:', tasks);
    console.log('Frontend Home: Tasks type:', Array.isArray(tasks) ? 'array' : typeof tasks);
    console.log('Frontend Home: Tasks length:', tasks?.length || 0);
    
    const container = document.getElementById('todays-tasks-container');
    const totalFocusTime = document.getElementById('total-focus-time');
    const startFocusBtn = document.getElementById('start-focus-btn');
    
    container.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        console.log('Frontend Home: No tasks to display');
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">🎯</div>
                <p class="text-white/80 text-xl mb-4">No tasks scheduled for today</p>
                <a href="goals.html" class="inline-flex items-center px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all duration-300">
                    Plan Your Day
                </a>
            </div>`;
        
        if (totalFocusTime) totalFocusTime.textContent = '0 hours of focused work today';
        if (startFocusBtn) startFocusBtn.disabled = true;
        return;
    }

    // Calculate total focus time
    const totalMinutes = tasks.reduce((sum, task) => sum + (task.estTime || 0), 0);
    const completedMinutes = tasks.filter(t => t.completed).reduce((sum, task) => sum + (task.estTime || 0), 0);
    
    if (totalFocusTime) {
        const hours = Math.round(totalMinutes / 60 * 10) / 10;
        const completedHours = Math.round(completedMinutes / 60 * 10) / 10;
        totalFocusTime.textContent = `${completedHours}/${hours} hours of focused work today`;
    }

    // Render tasks with enhanced styling
    tasks.forEach((task, index) => {
        const isCompleted = task.completed;
        const taskHtml = `
            <div class="task-card p-6 rounded-2xl ${isCompleted ? 'completed-task' : ''} transform hover:scale-[1.02] transition-all duration-300" 
                 data-task-id="${task._id}" style="animation-delay: ${index * 0.1}s">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h3 class="font-bold text-gray-900 text-lg mb-2 ${isCompleted ? 'line-through opacity-60' : ''}">${task.name}</h3>
                        <div class="flex items-center space-x-4 text-sm">
                            <div class="flex items-center space-x-2">
                                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span class="text-gray-600">${task.estTime || 30} min</span>
                            </div>
                            ${task.day ? `
                                <div class="flex items-center space-x-2">
                                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    <span class="text-gray-600">${task.day}</span>
                                </div>` : ''
                            }
                        </div>
                    </div>
                    <div class="ml-6 flex-shrink-0">
                        ${isCompleted ? 
                            `<div class="flex items-center space-x-2 text-green-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span class="font-semibold">Completed</span>
                            </div>` :
                            `<button class="start-task-btn bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" data-task-id="${task._id}">
                                <span class="flex items-center">
                                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                    Focus
                                </span>
                            </button>`
                        }
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', taskHtml);
    });

    // Enable/disable start focus button
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (startFocusBtn) {
        startFocusBtn.disabled = incompleteTasks.length === 0;
        if (incompleteTasks.length === 0) {
            startFocusBtn.innerHTML = `
                <span class="flex items-center">
                    <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    All Tasks Complete! 🎉
                </span>`;
        }
    }

    // Add click handlers for individual task focus buttons
    container.querySelectorAll('.start-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const taskId = btn.dataset.taskId;
            console.log('Individual task focus button clicked - taskId:', taskId);
            console.log('Redirecting to tasks page...');
            window.location.href = `tasks.html?taskId=${taskId}`;
        });
    });
}

function populateWeeklyGoals(goals = []) {
    console.log('Frontend Home: populateWeeklyGoals called with:', goals);
    console.log('Frontend Home: Goals type:', Array.isArray(goals) ? 'array' : typeof goals);
    console.log('Frontend Home: Goals length:', goals?.length || 0);
    
    const container = document.getElementById('weekly-goals-container');
    const goalsCompleted = document.getElementById('goals-completed');
    const tasksCompleted = document.getElementById('tasks-completed');
    const goalsPlanned = document.getElementById('goals-planned');
    const tasksPlanned = document.getElementById('tasks-planned');
    
    container.innerHTML = '';

    if (!goals || goals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-4xl mb-3">🎯</div>
                <p class="text-gray-500 text-sm mb-3">No goals set for this week</p>
                <a href="goals.html" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 text-sm">
                    Plan Your Week
                </a>
            </div>`;
        
        // Reset stats
        if (goalsPlanned) goalsPlanned.textContent = '0';
        if (tasksPlanned) tasksPlanned.textContent = '0';
        if (goalsCompleted) goalsCompleted.textContent = '0';
        if (tasksCompleted) tasksCompleted.textContent = '0';
        return;
    }

    let totalGoalsCompleted = 0;
    let totalTasksCompleted = 0;
    let totalTasks = 0;

    goals.forEach((goal, index) => {
        const completedCount = goal.tasks.filter(t => t.completed).length;
        const totalCount = goal.tasks.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const isJourneyGoal = goal._id === 'journey-goal';
        
        if (percentage === 100) totalGoalsCompleted++;
        totalTasksCompleted += completedCount;
        totalTasks += totalCount;

        const goalHtml = `
            <div class="goal-card p-3 ${isJourneyGoal ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200' : 'bg-white'} rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.01]" 
                 style="animation-delay: ${index * 0.1}s">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center flex-1 min-w-0">
                        ${isJourneyGoal ? 
                            `<div class="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                <svg class="w-2.5 h-2.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>` : ''
                        }
                        <div class="flex-1 min-w-0">
                            <h3 class="font-semibold text-gray-900 text-sm goal-title-truncate leading-tight">${goal.title}</h3>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2 flex-shrink-0">
                        ${isJourneyGoal ? 
                            `<span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                <svg class="w-2 h-2 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>AI
                            </span>` : ''
                        }
                        <span class="text-lg">${percentage === 100 ? '🏆' : (isJourneyGoal ? '💡' : '🎯')}</span>
                    </div>
                </div>
                
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-3">
                        <span class="text-xs text-gray-600">${completedCount}/${totalCount} tasks</span>
                        <span class="text-xs font-semibold ${percentage === 100 ? 'text-green-600' : (isJourneyGoal ? 'text-indigo-600' : 'text-indigo-600')}">${percentage}%</span>
                    </div>
                    ${percentage < 100 ? 
                        `<span class="text-xs text-gray-500">${totalCount - completedCount} left</span>` :
                        `<span class="text-xs text-green-600 font-semibold">Complete! 🎉</span>`
                    }
                </div>
                
                <div class="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div class="h-1.5 rounded-full transition-all duration-1000 ${percentage === 100 ? 'bg-gradient-to-r from-green-400 to-green-600' : (isJourneyGoal ? 'bg-gradient-to-r from-indigo-400 to-purple-600' : 'bg-gradient-to-r from-indigo-400 to-indigo-600')}" 
                         style="width: ${percentage}%"></div>
                </div>
                
                <div class="flex justify-between items-center">
                    <a href="goals.html" class="text-indigo-600 hover:text-indigo-700 text-xs font-medium">View Details →</a>
                    <div class="flex items-center space-x-1 text-xs text-gray-500">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>${Math.round(goal.tasks.reduce((sum, task) => sum + (task.estTime || 0), 0) / 60 * 10) / 10}h</span>
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', goalHtml);
    });

    // Update all stats
    if (goalsPlanned) goalsPlanned.textContent = goals.length;
    if (tasksPlanned) tasksPlanned.textContent = totalTasks;
    if (goalsCompleted) goalsCompleted.textContent = totalGoalsCompleted;
    if (tasksCompleted) tasksCompleted.textContent = totalTasksCompleted;
    
    // Update streak
    updateWeeklyStreak(goals);
}

function populateAnalytics(data) {
    const { weeklyGoals, todaysTasks, dailySnapshots } = data;
    
    // Calculate metrics
    const weeklyCompletion = computeWeeklyCompletionRate(weeklyGoals);
    const streak = dailySnapshots ? computeDailyStreak(dailySnapshots) : 0;
    const focusStats = computeFocusTimeStatsForTasks(todaysTasks);
    const productivityScore = calculateProductivityScore(weeklyGoals);
    
    // Update main analytics
    updateElement('weekly-completion-rate', `${weeklyCompletion}%`);
    updateElement('daily-streak', streak);
    updateElement('focus-time-week', formatHours(focusStats.plannedMinutes));
    updateElement('productivity-score', `${productivityScore}%`);
    
    const totalGoalsAchieved = weeklyGoals ? weeklyGoals.filter(g => 
        g.tasks.length > 0 && g.tasks.every(t => t.completed)
    ).length : 0;
    updateElement('total-goals-achieved', totalGoalsAchieved);
}

function updateProgressRing(data) {
    const progressCircle = document.getElementById('progress-circle');
    const weeklyCompletionRate = document.getElementById('weekly-completion-rate');
    
    if (progressCircle && data.weeklyGoals) {
        const completion = computeWeeklyCompletionRate(data.weeklyGoals);
        const circumference = 314; // 2 * π * 50
        const offset = circumference - (completion / 100) * circumference;
        
        // Animate the progress ring
        setTimeout(() => {
            progressCircle.style.strokeDashoffset = offset;
        }, 500);
        
        if (weeklyCompletionRate) {
            weeklyCompletionRate.textContent = `${completion}%`;
        }
    }
}

function startFocusSession() {
    // Get the first incomplete task
    const taskCards = document.querySelectorAll('.task-card[data-task-id]');
    let firstIncompleteTask = null;
    
    console.log('Focus button clicked - found task cards:', taskCards.length);
    
    for (const card of taskCards) {
        if (!card.classList.contains('completed-task')) {
            firstIncompleteTask = card.dataset.taskId;
            console.log('Found first incomplete task:', firstIncompleteTask);
            break;
        }
    }
    
    if (firstIncompleteTask) {
        console.log('Redirecting to tasks page with taskId:', firstIncompleteTask);
        window.location.href = `tasks.html?taskId=${firstIncompleteTask}`;
    } else {
        console.log('No incomplete tasks found - showing celebration');
        // All tasks completed - show celebration
        showCompletionCelebration();
    }
}

function showCompletionCelebration() {
    const startFocusBtn = document.getElementById('start-focus-btn');
    if (startFocusBtn) {
        startFocusBtn.innerHTML = `
            <span class="flex items-center">
                <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                🎉 All Done for Today! 🎉
            </span>`;
        startFocusBtn.disabled = true;
        
        // Add celebration animation
        startFocusBtn.classList.add('animate-pulse');
        
        // Show confetti effect (simple version)
        createConfettiEffect();
    }
}

function createConfettiEffect() {
    const confettiCount = 50;
    const container = document.querySelector('.main-focus-section');
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'][Math.floor(Math.random() * 5)]};
            top: -10px;
            left: ${Math.random() * 100}%;
            border-radius: 50%;
            pointer-events: none;
            animation: confetti-fall 3s linear forwards;
            z-index: 1000;
        `;
        
        container.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 3000);
    }
}

// Add confetti animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes confetti-fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

function showErrorState() {
    const containers = [
        'todays-tasks-container',
        'weekly-goals-container'
    ];
    
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-red-500 mb-4">
                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                    <p class="text-gray-500">Unable to load data. Please refresh the page.</p>
                    <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        Refresh
                    </button>
                </div>`;
        }
    });
}

// Helper functions
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function calculateProductivityScore(goals) {
    if (!goals || goals.length === 0) return 0;
    
    const totalTasks = goals.reduce((sum, goal) => sum + goal.tasks.length, 0);
    const completedTasks = goals.reduce((sum, goal) => 
        sum + goal.tasks.filter(t => t.completed).length, 0);
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

function formatHours(minutes) {
    const hrs = minutes / 60;
    return `${hrs % 1 === 0 ? hrs.toFixed(0) : hrs.toFixed(1)}h`;
}

// Keep existing utility functions
function computeWeeklyCompletionRate(goals) {
    if (!goals || goals.length === 0) return 0;
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    goals.forEach(goal => {
        totalTasks += goal.tasks.length;
        completedTasks += goal.tasks.filter(t => t.completed).length;
    });
    
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

function computeDailyStreak(dailySnapshots) {
    if (!dailySnapshots || dailySnapshots.length === 0) return 0;
    
    // Sort by date descending
    const sorted = dailySnapshots.sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    
    for (const snapshot of sorted) {
        if (snapshot.tasksCompleted > 0) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

function computeFocusTimeStatsForTasks(tasks) {
    if (!tasks || tasks.length === 0) {
        return { plannedMinutes: 0, completedMinutes: 0 };
    }
    
    const plannedMinutes = tasks.reduce((sum, task) => sum + (task.estTime || 0), 0);
    const completedMinutes = tasks
        .filter(task => task.completed)
        .reduce((sum, task) => sum + (task.estTime || 0), 0);
    
    return { plannedMinutes, completedMinutes };
}

function updateWeeklyStreak(goals) {
    if (!goals || goals.length === 0) {
        updateElement('current-streak', '0');
        resetStreakIndicators();
        return;
    }
    
    // Calculate completion status for each day
    const dayStats = calculateDailyCompletionStats(goals);
    
    // Calculate streak
    const streak = calculateCurrentStreak(dayStats);
    
    // Update UI
    updateElement('current-streak', streak);
    updateStreakIndicators(dayStats);
}

function calculateDailyCompletionStats(goals) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayStats = {};
    
    days.forEach(day => {
        dayStats[day] = { hasPlannedTasks: false, allCompleted: false };
    });
    
    // Go through all goals and their tasks
    goals.forEach(goal => {
        goal.tasks.forEach(task => {
            if (task.day && days.includes(task.day)) {
                dayStats[task.day].hasPlannedTasks = true;
                
                // If there's a planned task and it's not completed, mark day as not fully completed
                if (!task.completed) {
                    dayStats[task.day].allCompleted = false;
                }
            }
        });
    });
    
    // Set allCompleted to true for days with planned tasks where all are completed
    days.forEach(day => {
        if (dayStats[day].hasPlannedTasks) {
            const dayTasks = [];
            goals.forEach(goal => {
                goal.tasks.forEach(task => {
                    if (task.day === day) {
                        dayTasks.push(task);
                    }
                });
            });
            
            if (dayTasks.length > 0) {
                dayStats[day].allCompleted = dayTasks.every(task => task.completed);
            }
        }
    });
    
    return dayStats;
}

function calculateCurrentStreak(dayStats) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const currentDay = getDayString(today);
    
    // Find current day index
    const currentDayIndex = days.indexOf(currentDay);
    
    let streak = 0;
    
    // Count backwards from current day
    for (let i = currentDayIndex; i >= 0; i--) {
        const day = days[i];
        const dayData = dayStats[day];
        
        if (dayData.hasPlannedTasks && dayData.allCompleted) {
            streak++;
        } else if (dayData.hasPlannedTasks && !dayData.allCompleted) {
            // If there are planned tasks but not all completed, break streak
            break;
        }
        // If no planned tasks, continue counting (doesn't break streak)
    }
    
    return streak;
}

function updateStreakIndicators(dayStats) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const indicators = document.querySelectorAll('#streak-indicators .streak-day');
    
    indicators.forEach((indicator, index) => {
        const day = days[index];
        const dayData = dayStats[day];
        const circle = indicator.querySelector('.w-6');
        
        if (!dayData.hasPlannedTasks) {
            // No tasks planned for this day
            circle.className = 'w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs border-2 border-gray-200';
            circle.textContent = '—';
        } else if (dayData.allCompleted) {
            // All tasks completed
            circle.className = 'w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs border-2 border-green-400';
            circle.textContent = '✅';
        } else {
            // Tasks planned but not all completed
            circle.className = 'w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs border-2 border-red-400';
            circle.textContent = '❌';
        }
    });
}

function resetStreakIndicators() {
    const indicators = document.querySelectorAll('#streak-indicators .streak-day');
    indicators.forEach(indicator => {
        const circle = indicator.querySelector('.w-6');
        circle.className = 'w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs';
        circle.textContent = '❌';
    });
}

// Plan My Week functionality
let currentGeneratedPlan = null;

function initializePlanMyWeek() {
    // Initialize week selector
    populateWeekSelector();
    
    // Setup event listeners
    setupPlanMyWeekListeners();
    
    // Debug: Test API connection (only in development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Development environment detected - testing API connection');
        testAPIConnection();
    }
}

async function testAPIConnection() {
    try {
        const token = localStorage.getItem('authToken');
        console.log('🔍 Testing API connection...');
        console.log('🔐 Token exists:', !!token);
        
        if (!token) {
            console.log('❌ No auth token found');
            return;
        }
        
        const response = await fetch('/api/llm/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 API Status Response:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API Connection successful:', data);
        } else {
            console.log('❌ API Connection failed:', response.status);
        }
    } catch (error) {
        console.log('❌ API Connection error:', error);
    }
}

function setupPlanMyWeekListeners() {
    const weekInput = document.getElementById('week-input');
    const generateBtn = document.getElementById('generate-plan-btn');
    const charCount = document.getElementById('char-count');
    const charValidation = document.getElementById('char-validation');
    
    if (!weekInput || !generateBtn) return;
    
    // Character count and validation
    weekInput.addEventListener('input', () => {
        const length = weekInput.value.length;
        charCount.textContent = `${length}/500 characters`;
        
        if (length < 50) {
            charValidation.textContent = `Minimum 50 characters (${50 - length} more needed)`;
            charValidation.className = 'text-red-400';
            generateBtn.disabled = true;
        } else {
            charValidation.textContent = 'Ready to generate!';
            charValidation.className = 'text-green-400';
            generateBtn.disabled = false;
        }
    });
    
    // Generate plan button
    generateBtn.addEventListener('click', generateWeeklyPlan);
}

function populateWeekSelector() {
    const weekSelector = document.getElementById('week-selector');
    if (!weekSelector) return;
    
    const options = [];
    const currentWeek = getStartOfWeek(new Date());
    
    // Add previous week, current week, and next 2 weeks
    for (let i = -1; i <= 2; i++) {
        const weekStart = new Date(currentWeek);
        weekStart.setDate(currentWeek.getDate() + (i * 7));
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const isCurrentWeek = i === 0;
        const label = isCurrentWeek ? 
            `This Week (${formatWeekRange(weekStart, weekEnd)})` :
            formatWeekRange(weekStart, weekEnd);
        
        options.push({
            value: weekStart.toISOString(),
            label: label,
            selected: isCurrentWeek
        });
    }
    
    weekSelector.innerHTML = options.map(option => 
        `<option value="${option.value}" ${option.selected ? 'selected' : ''}>${option.label}</option>`
    ).join('');
}

function formatWeekRange(startDate, endDate) {
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
}

async function generateWeeklyPlan() {
    const weekInput = document.getElementById('week-input');
    const weekSelector = document.getElementById('week-selector');
    const generateBtn = document.getElementById('generate-plan-btn');
    const planPreview = document.getElementById('plan-preview');
    
    if (!weekInput || !weekSelector || !generateBtn || !planPreview) {
        console.error('❌ Missing DOM elements');
        return;
    }
    
    const userInput = weekInput.value.trim();
    const weekOf = weekSelector.value;
    
    console.log('🚀 Starting weekly plan generation...');
    console.log('📝 User input length:', userInput.length);
    console.log('📅 Week of:', weekOf);
    
    if (userInput.length < 50) {
        console.log('❌ Input too short');
        showError('Please provide at least 50 characters describing your goals.');
        return;
    }
    
    // Show loading state
    setGeneratingState(true);
    
    try {
        const token = localStorage.getItem('authToken');
        console.log('🔐 Token:', token ? 'Present' : 'Missing');
        console.log('🔐 Token preview:', token ? token.substring(0, 20) + '...' : 'N/A');
        
        const requestData = {
            userInput: userInput,
            weekOf: weekOf
        };
        console.log('📤 Request data:', requestData);
        
        console.log('📡 Making request to /api/llm/plan-week...');
        const response = await fetch('/api/llm/plan-week', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('📨 Response received!');
        console.log('📨 Response status:', response.status);
        console.log('📨 Response ok:', response.ok);
        console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()));
        
        let data;
        try {
            data = await response.json();
            console.log('📨 Response data:', data);
        } catch (parseError) {
            console.error('❌ Failed to parse JSON response:', parseError);
            const textResponse = await response.text();
            console.log('📨 Raw response text:', textResponse);
            throw new Error('Server returned invalid JSON');
        }
        
        if (!response.ok) {
            console.log('❌ Request failed with status:', response.status);
            if (data.error === 'vision_assessment_required') {
                showVisionAssessmentPrompt();
            } else {
                showError(data.message || 'Failed to generate plan');
            }
            return;
        }
        
        if (data.success && data.goal) {
            console.log('✅ Plan generated successfully!');
            currentGeneratedPlan = data.goal;
            // Store available days for task assignment
            currentGeneratedPlan.availableDays = data.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            displayGeneratedPlan(data.goal, data.metadata);
        } else {
            console.log('❌ Invalid response structure');
            showError('Failed to generate plan');
        }
        
    } catch (error) {
        console.error('❌ Error generating plan:', error);
        console.error('❌ Error type:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Network connection error. Please check your internet connection and try again.');
        } else if (error.name === 'SyntaxError') {
            showError('Server response error. Please try again.');
        } else {
            showError(`Network error: ${error.message}`);
        }
    } finally {
        setGeneratingState(false);
    }
}

function setGeneratingState(isGenerating) {
    const generateBtn = document.getElementById('generate-plan-btn');
    const planPreview = document.getElementById('plan-preview');
    
    if (isGenerating) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = `
            <span class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Generating Plan...
            </span>
        `;
        
        planPreview.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <h4 class="text-xl font-semibold text-white/90 mb-2">Creating your personalized plan...</h4>
                <p class="text-white/70">Analyzing your goals and preferences</p>
            </div>
        `;
    } else {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <span class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Generate My Plan
            </span>
        `;
    }
}

function displayGeneratedPlan(goal, metadata) {
    const planPreview = document.getElementById('plan-preview');
    if (!planPreview) return;
    
    const totalTime = goal.tasks.reduce((sum, task) => sum + task.estTime, 0);
    const totalHours = Math.round(totalTime / 60 * 10) / 10;
    
    planPreview.innerHTML = `
        <div class="space-y-6">
            <!-- Goal Header -->
            <div class="bg-white/10 rounded-xl p-6 border border-white/20">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-3">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                            </svg>
                        </div>
                        <h4 class="text-xl font-bold text-white">${goal.title}</h4>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-white/60">Total Time</div>
                        <div class="text-lg font-bold text-white">${totalHours}h</div>
                    </div>
                </div>
                <div class="text-sm text-white/60">
                    Generated with ${metadata.provider} • ${goal.tasks.length} tasks
                </div>
            </div>
            
            <!-- Tasks List -->
            <div class="space-y-3">
                <h5 class="text-lg font-semibold text-white/90 mb-3">Suggested Tasks:</h5>
                ${goal.tasks.map((task, index) => `
                    <div class="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-200">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <div class="flex items-center mb-2">
                                    <span class="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                                        ${index + 1}
                                    </span>
                                    <h6 class="text-white font-medium">${task.name}</h6>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2 text-sm text-white/60">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span>${task.estTime} min</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Add to Plan Button -->
            <div class="pt-4">
                <button 
                    id="add-to-plan-btn"
                    class="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    onclick="addPlanToWeeklyGoals()"
                >
                    <span class="flex items-center justify-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        Add to My Plan
                    </span>
                </button>
            </div>
        </div>
    `;
}

function showVisionAssessmentPrompt() {
    const planPreview = document.getElementById('plan-preview');
    if (!planPreview) return;
    
    planPreview.innerHTML = `
        <div class="text-center py-12">
            <div class="text-6xl mb-4">🔍</div>
            <h4 class="text-xl font-bold text-white/90 mb-3">Vision Assessment Required</h4>
            <p class="text-white/70 mb-6">Complete your vision assessment to get personalized weekly plans tailored to your goals and learning style.</p>
            <a href="vision-questionnaire.html" class="inline-flex items-center px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all duration-300">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Complete Assessment
            </a>
        </div>
    `;
}

function showError(message) {
    const planPreview = document.getElementById('plan-preview');
    if (!planPreview) return;
    
    planPreview.innerHTML = `
        <div class="text-center py-12">
            <div class="text-6xl mb-4">⚠️</div>
            <h4 class="text-xl font-bold text-red-400 mb-3">Error</h4>
            <p class="text-white/70 mb-6">${message}</p>
            <button 
                onclick="location.reload()" 
                class="inline-flex items-center px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all duration-300"
            >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Try Again
            </button>
        </div>
    `;
}

async function addPlanToWeeklyGoals() {
    if (!currentGeneratedPlan) return;
    
    const weekSelector = document.getElementById('week-selector');
    const addBtn = document.getElementById('add-to-plan-btn');
    
    if (!weekSelector || !addBtn) return;
    
    const weekOf = weekSelector.value;
    
    // Show loading state
    addBtn.disabled = true;
    addBtn.innerHTML = `
        <span class="flex items-center justify-center">
            <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Adding to Plan...
        </span>
    `;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/weeklyGoals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                weekOf: weekOf,
                goals: [{
                    title: currentGeneratedPlan.title,
                    tasks: currentGeneratedPlan.tasks.map((task, index) => {
                        // Distribute tasks across available days to avoid past days
                        const availableDays = currentGeneratedPlan.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        const assignedDay = availableDays[index % availableDays.length];
                        console.log(`📅 Assigning task "${task.name}" to ${assignedDay}`);
                        return {
                            name: task.name,
                            estTime: task.estTime,
                            day: assignedDay, // Distribute across available days
                            repeatType: 'none'
                        };
                    })
                }]
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success message
            showSuccessMessage();
            
            // Reset form
            setTimeout(() => {
                document.getElementById('week-input').value = '';
                document.getElementById('char-count').textContent = '0/500 characters';
                document.getElementById('char-validation').textContent = 'Minimum 50 characters';
                document.getElementById('char-validation').className = 'text-white/60';
                document.getElementById('generate-plan-btn').disabled = true;
                
                // Reset preview
                const planPreview = document.getElementById('plan-preview');
                planPreview.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">🎯</div>
                        <h4 class="text-xl font-semibold text-white/90 mb-2">Ready to plan your week?</h4>
                        <p class="text-white/70">Describe what you want to accomplish and get a personalized plan tailored to your goals and learning style.</p>
                    </div>
                `;
                
                // Refresh the weekly goals section
                loadDashboardData();
            }, 2000);
            
        } else {
            showError(data.message || 'Failed to add plan to weekly goals');
        }
        
    } catch (error) {
        console.error('Error adding plan:', error);
        showError('Network error. Please try again.');
    } finally {
        addBtn.disabled = false;
        addBtn.innerHTML = `
            <span class="flex items-center justify-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Add to My Plan
            </span>
        `;
    }
}

function showSuccessMessage() {
    const planPreview = document.getElementById('plan-preview');
    if (!planPreview) return;
    
    planPreview.innerHTML = `
        <div class="text-center py-12">
            <div class="text-6xl mb-4">🎉</div>
            <h4 class="text-xl font-bold text-green-400 mb-3">Plan Added Successfully!</h4>
            <p class="text-white/70 mb-6">Your weekly plan has been added to your goals. You can now assign tasks to specific days and start working on them.</p>
            <a href="goals.html" class="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                View in Weekly Goals
            </a>
        </div>
    `;
}

// ========== REFLECTION FUNCTIONALITY ==========

function setupReflectionModal() {
    const modal = document.getElementById('reflection-modal');
    const backdrop = document.getElementById('reflection-backdrop');
    const closeBtn = document.getElementById('close-reflection-modal');
    const cancelBtn = document.getElementById('cancel-reflection');
    const saveBtn = document.getElementById('save-reflection');
    const typeSelect = document.getElementById('reflection-type');
    const textArea = document.getElementById('reflection-text');
    const charCount = document.getElementById('reflection-char-count');
    const moodBtns = document.querySelectorAll('.mood-btn');

    // Close modal handlers
    [backdrop, closeBtn, cancelBtn].forEach(el => {
        if (el) el.addEventListener('click', closeReflectionModal);
    });

    // Type selection handler
    if (typeSelect) {
        typeSelect.addEventListener('change', handleReflectionTypeChange);
    }

    // Text input handler
    if (textArea) {
        textArea.addEventListener('input', () => {
            const length = textArea.value.length;
            charCount.textContent = length;
            document.getElementById('save-reflection').disabled = length < 10;
        });
    }

    // Mood selection
    moodBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            moodBtns.forEach(b => b.classList.remove('bg-indigo-100', 'border-indigo-300'));
            e.target.classList.add('bg-indigo-100', 'border-indigo-300');
        });
    });

    // Save reflection (prevent form submission and handle programmatically)
    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveReflection();
        });
    }
}

function openReflectionModal() {
    const modal = document.getElementById('reflection-modal');
    
    // Populate weekly goals if needed
    populateWeeklyGoalsForReflection();
    
    // Reset form
    resetReflectionForm();
    
    // Show modal
    modal.classList.remove('hidden');
}

function closeReflectionModal() {
    const modal = document.getElementById('reflection-modal');
    modal.classList.add('hidden');
}

function handleReflectionTypeChange() {
    const type = document.getElementById('reflection-type').value;
    const goalSelector = document.getElementById('weekly-goal-selector');
    
    if (type === 'weekly_goal') {
        goalSelector.classList.remove('hidden');
    } else {
        goalSelector.classList.add('hidden');
    }
}

function populateWeeklyGoalsForReflection() {
    const select = document.getElementById('reflection-weekly-goal');
    
    // Use existing weekly goals data from loadDashboardData
    const goalsContainer = document.getElementById('weekly-goals-container');
    const goalElements = goalsContainer.querySelectorAll('[data-goal-id]');
    
    select.innerHTML = '<option value="">Select a weekly goal...</option>';
    
    goalElements.forEach(el => {
        const goalId = el.dataset.goalId;
        const goalTitle = el.querySelector('.goal-title-truncate')?.textContent || 'Untitled Goal';
        select.innerHTML += `<option value="${goalId}">${goalTitle}</option>`;
    });
}

function resetReflectionForm() {
    document.getElementById('reflection-type').value = 'daily_reflection';
    document.getElementById('reflection-text').value = '';
    document.getElementById('reflection-char-count').textContent = '0';
    document.getElementById('save-reflection').disabled = true;
    document.getElementById('weekly-goal-selector').classList.add('hidden');
    
    // Reset mood selection
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-100', 'border-indigo-300');
    });
}

async function saveReflection() {
    const type = document.getElementById('reflection-type').value;
    const text = document.getElementById('reflection-text').value;
    const selectedMood = document.querySelector('.mood-btn.bg-indigo-100')?.dataset.mood;
    const weeklyGoalId = document.getElementById('reflection-weekly-goal').value;
    
    // Validate input
    if (!text || text.length < 10) {
        showReflectionError('Please write at least 10 characters for your reflection.');
        return;
    }
    
    const payload = {
        reflectionType: type,
        content: {
            text: text,
            mood: selectedMood
        },
        context: {}
    };

    // Add context if weekly goal is selected
    if (type === 'weekly_goal' && weeklyGoalId) {
        payload.context = { weeklyGoalId };
    }

    try {
        // Disable save button during request
        const saveBtn = document.getElementById('save-reflection');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/reflections', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            closeReflectionModal();
            showReflectionSuccess('Reflection saved successfully! 🎉');
        } else {
            throw new Error(result.message || 'Failed to save reflection');
        }
    } catch (error) {
        console.error('Failed to save reflection:', error);
        showReflectionError('Failed to save reflection. Please try again.');
    } finally {
        // Re-enable save button
        const saveBtn = document.getElementById('save-reflection');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Reflection';
    }
}

function showReflectionSuccess(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

function showReflectionError(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-transform duration-300 translate-x-full';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}


function getBacklogTasks() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayIndex = new Date().getDay();
    const tasks = [];

    weeklyGoalsData.forEach(goal => {
        (goal.tasks || []).forEach(task => {
            const taskIndex = days.indexOf(task.day);
            if (!task.completed && task.day && taskIndex !== -1 && taskIndex < todayIndex) {
                tasks.push(task);
            }
        });
    });

    return tasks;
}

function populateBacklogTasks() {
    const container = document.getElementById('backlog-tasks-container');
    if (!container) return;

    const tasks = getBacklogTasks();
    container.innerHTML = '';

    if (tasks.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">No backlog tasks! 🎉</p>';
        return;
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    tasks.forEach(task => {
        const dayIndex = days.indexOf(task.day);
        let dateStr = '';
        if (dayIndex !== -1) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + dayIndex);
            dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        container.innerHTML += `
            <div class="task-card p-4 rounded-xl flex items-center justify-between">
                <div>
                    <h4 class="font-semibold text-gray-900">${task.name}</h4>
                    <p class="text-sm text-gray-600">${dateStr}</p>
                </div>
                <button class="focus-button text-white px-3 py-2 rounded-lg focus-now-btn" data-task-id="${task._id}">Focus Now</button>
            </div>
        `;
    });
}

function openBacklogModal() {
    populateBacklogTasks();
    const modal = document.getElementById('backlog-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeBacklogModal() {
    const modal = document.getElementById('backlog-modal');
    if (modal) modal.classList.add('hidden');
}

function setupBacklogModal() {
    const backdrop = document.getElementById('backlog-backdrop');
    const closeBtn = document.getElementById('close-backlog-modal');
    [backdrop, closeBtn].forEach(el => {
        if (el) el.addEventListener('click', closeBacklogModal);
    });

    const container = document.getElementById('backlog-tasks-container');
    if (container) {
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.focus-now-btn');
            if (btn) {
                const taskId = btn.dataset.taskId;
                if (taskId) {
                    window.location.href = `tasks.html?taskId=${taskId}`;
                }
            }
        });
    }
}
