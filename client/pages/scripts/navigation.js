/**
 * Unified Navigation System for Karvia
 * Handles consistent navigation across all pages and user flow routing
 */

// Navigation configuration for different user types
const NAVIGATION_CONFIG = {
    // Navigation links for returning users (complete experience)
    returning: [
        { href: 'home.html', label: 'Dashboard', icon: 'home' },
        { href: 'my_journey.html', label: 'My Journey', icon: 'map' },
        { href: 'goals.html', label: 'Plan Week', icon: 'calendar' },
        { href: 'analysis.html', label: 'Analysis', icon: 'chart' }
    ],
    
    // Navigation links for first-time users (limited until onboarding complete)
    firstTime: [
        { href: 'my_journey.html', label: 'My Journey', icon: 'map' },
        { href: 'analysis.html', label: 'Analysis', icon: 'chart' }
    ]
};

// SVG Icons for navigation
const NAVIGATION_ICONS = {
    home: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>`,
    
    calendar: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>`,
    
    chart: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>`,
    
    lightbulb: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>`,
    
    menu: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>`,
    
    close: `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>`,
    
    journey: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
    </svg>`,
    
    map: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
    </svg>`,
    
    profile: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>`
};

// User state management
class UserStateManager {
    static isFirstTimeUser() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return !user.onboardingCompleted;
    }
    
    static hasCompletedOnboarding() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.onboardingCompleted === true;
    }
    
    static getCurrentPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }
    
    static async shouldRedirectToOnboarding() {
        const currentPage = this.getCurrentPage();
        const isOnJourneyPage = currentPage === 'my_journey.html';
        const isOnAnalysisPage = currentPage === 'analysis.html';
        const isOnVisionQuestPage = currentPage === 'vision-questionnaire.html';
        const isOnLoginPage = currentPage === 'index.html';
        
        // Don't redirect if already on allowed pages or login page
        if (isOnJourneyPage || isOnAnalysisPage || isOnVisionQuestPage || isOnLoginPage) {
            return false;
        }
        
        // Use smart routing: check if user has generated plans
        const hasGeneratedPlan = await this.hasGeneratedPlan();
        if (hasGeneratedPlan) {
            return false; // User with generated plans should go to dashboard, not onboarding
        }
        
        // Check if user has dreams (but no plans yet)
        const hasDreams = await this.hasDreams();
        if (hasDreams) {
            return true; // User with dreams but no plans should complete onboarding
        }
        
        // New users with no dreams should go to onboarding
        return true;
    }
    
    static async hasGeneratedPlan() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return false;
            
            const response = await fetch('/api/dreams/active', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success && data.data && data.data.length > 0 && 
                       data.data.some(dream => dream.planGenerated);
            }
            return false;
        } catch (error) {
            console.error('Error checking generated plans:', error);
            return false;
        }
    }
    
    static async hasDreams() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return false;
            
            const response = await fetch('/api/dreams/active', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success && data.data && data.data.length > 0;
            }
            return false;
        } catch (error) {
            console.error('Error checking dreams:', error);
            return false;
        }
    }
    
    static async shouldRedirectToHome() {
        const currentPage = this.getCurrentPage();
        const isOnLoginPage = currentPage === 'index.html';
        
        // Only redirect to home from login page
        if (!isOnLoginPage) {
            return false;
        }
        
        // Users with generated plans should go to home/dashboard
        const hasGeneratedPlan = await this.hasGeneratedPlan();
        return hasGeneratedPlan;
    }
}

// Navigation component generator
class NavigationComponent {
    static async getDynamicJourneyUrl() {
        // Check if user has an active journey
        const token = localStorage.getItem('authToken');
        if (!token) return 'my_journey.html';
        
        try {
            const response = await fetch('/api/dreams/active', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    const activeDream = data.data[0];
                    if (activeDream.planGenerated && activeDream.goalIds && activeDream.goalIds.length > 0) {
                        return 'my_journey.html';
                    }
                }
            }
        } catch (error) {
            console.error('Error checking journey status:', error);
        }
        
        return 'my_journey.html';
    }
    
    static async processNavLinks(navLinks) {
        const processedLinks = [];
        
        for (const link of navLinks) {
            if (link.dynamic && link.label === 'Journey') {
                const journeyUrl = await this.getDynamicJourneyUrl();
                processedLinks.push({
                    ...link,
                    href: journeyUrl
                });
            } else {
                processedLinks.push(link);
            }
        }
        
        return processedLinks;
    }
    
    static async generateNavigation() {
        const isFirstTime = UserStateManager.isFirstTimeUser();
        const currentPage = UserStateManager.getCurrentPage();
        const baseNavLinks = isFirstTime ? NAVIGATION_CONFIG.firstTime : NAVIGATION_CONFIG.returning;
        const navLinks = await this.processNavLinks(baseNavLinks);
        
        return `
            <nav style="background: white !important; position: sticky !important; top: 0 !important; z-index: 9999 !important; width: 100% !important; box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important; border-bottom: 1px solid #ddd !important;">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-24 items-center">
                        <div class="flex items-center">
                            <a href="${isFirstTime ? 'analysis.html' : 'home.html'}" class="flex items-center">
                                <img src="assets/WhiteMetallic.png" alt="Karvia Logo" class="h-40 w-auto object-contain object-center" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
                            </a>
                        </div>
                        
                        <!-- Mobile menu button -->
                        <div class="lg:hidden">
                            <button id="mobile-menu-button" class="p-2 rounded-md text-gray-700 hover:text-gray-900 focus:outline-none">
                                <span class="sr-only">Open menu</span>
                                <span id="mobile-menu-icon">${NAVIGATION_ICONS.menu}</span>
                            </button>
                        </div>
                        
                        <!-- Desktop navigation -->
                        <div class="flex items-center space-x-4">
                            ${navLinks.map(link => `
                                <a href="${link.href}" class="nav-link inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100 ${currentPage === link.href ? 'bg-gray-100 text-gray-900' : ''}" style="color: #374151 !important; text-decoration: none !important;">
                                    ${NAVIGATION_ICONS[link.icon] || '🔗'}
                                    <span class="ml-2">${link.label}</span>
                                </a>
                            `).join('')}
                            <a href="user_profile.html" class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100" title="User Profile" style="color: #374151 !important; text-decoration: none !important;">
                                ${NAVIGATION_ICONS.profile || '👤'}
                                <span class="ml-2 hidden sm:inline">Profile</span>
                            </a>
                            <button id="logout-button" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; font-weight: 500 !important; padding: 8px 16px !important; border-radius: 8px !important; font-size: 14px !important; border: none !important; cursor: pointer !important;">
                                Logout
                            </button>
                        </div>
                    </div>
                    
                    <!-- Mobile navigation menu -->
                    <div id="mobile-menu" class="lg:hidden hidden bg-white shadow-lg rounded-lg mt-2 p-4 space-y-2">
                        ${navLinks.map(link => `
                            <a href="${link.href}" class="mobile-nav-link flex items-center px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 ${currentPage === link.href ? 'bg-gray-50 text-gray-900' : ''}">
                                ${NAVIGATION_ICONS[link.icon]}
                                <span class="ml-3">${link.label}</span>
                            </a>
                        `).join('')}
                        <a href="user_profile.html" class="mobile-nav-link flex items-center px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200">
                            ${NAVIGATION_ICONS.profile}
                            <span class="ml-3">Profile</span>
                        </a>
                        <button id="mobile-logout-button" class="w-full flex items-center px-4 py-3 nav-brand text-white rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
        `;
    }
    
    static async initializeNavigation() {
        // Find navigation container or create one
        let navContainer = document.querySelector('#navigation-container');
        if (!navContainer) {
            navContainer = document.createElement('div');
            navContainer.id = 'navigation-container';
            document.body.insertBefore(navContainer, document.body.firstChild);
        }
        
        // Insert navigation HTML
        navContainer.innerHTML = await this.generateNavigation();
        
        // Initialize mobile menu functionality
        this.initializeMobileMenu();
        
        // Initialize logout functionality
        this.initializeLogout();
    }
    
    static initializeMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileMenuIcon = document.getElementById('mobile-menu-icon');
        
        if (mobileMenuButton && mobileMenu && mobileMenuIcon) {
            mobileMenuButton.addEventListener('click', () => {
                const isOpen = !mobileMenu.classList.contains('hidden');
                
                if (isOpen) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuIcon.innerHTML = NAVIGATION_ICONS.menu;
                } else {
                    mobileMenu.classList.remove('hidden');
                    mobileMenuIcon.innerHTML = NAVIGATION_ICONS.close;
                }
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuIcon.innerHTML = NAVIGATION_ICONS.menu;
                }
            });
        }
    }
    
    static initializeLogout() {
        const logoutButtons = document.querySelectorAll('#logout-button, #mobile-logout-button');
        
        logoutButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Clear all authentication and user data
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                localStorage.removeItem('userName');
                localStorage.removeItem('onboardingCompleted');
                localStorage.removeItem('onboardingData');
                localStorage.removeItem('journeyFormLocked');
                
                // Redirect to login page
                window.location.href = 'index.html';
            });
        });
    }
}

// User flow routing
class UserFlowRouter {
    static async handleUserFlow() {
        // Check if user is authenticated
        const token = localStorage.getItem('authToken');
        if (!token) {
            // TEMPORARY: Skip auth redirect for debugging
            if (UserStateManager.getCurrentPage() === 'my_journey.html') {
                console.log('DEBUG: Allowing journey page access without auth');
                return;
            }
            if (UserStateManager.getCurrentPage() !== 'index.html') {
                window.location.href = 'index.html';
            }
            return;
        }
        
        // Check user state and redirect accordingly
        const shouldRedirectToOnboarding = await UserStateManager.shouldRedirectToOnboarding();
        if (shouldRedirectToOnboarding) {
            window.location.href = 'my_journey.html';
            return;
        }
        
        const shouldRedirectToHome = await UserStateManager.shouldRedirectToHome();
        if (shouldRedirectToHome) {
            window.location.href = 'home.html';
            return;
        }
        
        // Navigation is now initialized at the top of DOMContentLoaded
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Always initialize navigation first
    const token = localStorage.getItem('authToken');
    if (token) {
        await NavigationComponent.initializeNavigation();
    }
    
    // Then handle user flow routing
    await UserFlowRouter.handleUserFlow();
});

// Export for use in other modules
window.NavigationSystem = {
    UserStateManager,
    NavigationComponent,
    UserFlowRouter
};