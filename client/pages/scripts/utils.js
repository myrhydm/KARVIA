/**
 * utils.js
 * Contains shared utility functions for the Karvia application.
 */

/**
 * Redirects the user to the login page if no auth token is found in localStorage.
 * Also checks if user has completed onboarding and redirects appropriately.
 */
async function redirectIfNoToken() {
    console.log('🔐 Starting authentication check...');
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log("❌ Authentication token not found. Redirecting to login page.");
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Token found, checking onboarding status...');
    
    try {
        // Check if user has completed onboarding
        await checkOnboardingStatus();
        console.log('✅ Onboarding check completed');
    } catch (error) {
        console.error('❌ Error checking onboarding status:', error);
        // Continue anyway for new users
    }
    
    console.log('🎯 Setting page opacity to 1');
    // Show the page content after authentication checks are complete
    document.body.style.opacity = '1';
}

/**
 * Checks if the user has completed onboarding and redirects if not
 */
async function checkOnboardingStatus() {
    const token = localStorage.getItem('authToken');
    const currentPage = window.location.pathname.split('/').pop();
    
    console.log('🔍 Checking onboarding status for page:', currentPage);
    
    // Skip onboarding check if already on journey page, analysis, or vision quest pages
    if (currentPage === 'journey.html' || currentPage === 'analysis.html' || currentPage === 'vision-questionnaire.html') {
        console.log('✅ On allowed page, skipping onboarding check');
        return;
    }
    
    // Check if user data is already in localStorage (from auth.js)
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
        try {
            const userData = JSON.parse(existingUser);
            // If user data exists and onboarding is not completed, redirect
            if (!userData.onboardingCompleted) {
                window.location.href = 'journey.html';
                return;
            }
            // If onboarding is completed, user can continue
            return;
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            // Continue to API call if localStorage data is corrupted
        }
    }
    
    // Only make API call if user data is not in localStorage AND we're not on journey page
    if (currentPage !== 'journey.html') {
        try {
            const response = await fetch('/api/auth/onboarding-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Store user data in localStorage for navigation system
                localStorage.setItem('user', JSON.stringify({
                    onboardingCompleted: data.onboardingCompleted,
                    name: data.name,
                    email: data.email
                }));
                
                // First-time users should go to journey unless they're on allowed pages
                if (!data.onboardingCompleted) {
                    window.location.href = 'journey.html';
                    return;
                }
            } else if (response.status === 401) {
                // Handle auth error
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
                return;
            }
        } catch (error) {
            console.error('Error checking onboarding status:', error);
            // Don't redirect on error, let user continue
        }
    }
}

/**
 * Handles authentication errors from API responses.
 * @param {Response} response - The fetch response object
 * @param {object} data - The parsed JSON response data
 * @returns {boolean} true if auth error was handled, false otherwise
 */
function handleAuthError(response, data) {
    if (response.status === 401) {
        console.log("Authentication failed:", data.msg);
        
        // Check for specific user not found error
        if (data.code === 'USER_NOT_FOUND') {
            alert('Your session has expired or your account was not found. Please log in again.');
        } else {
            alert('Authentication failed. Please log in again.');
        }
        
        // Clear the invalid token and redirect to login
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
        return true;
    }
    return false;
}

/**
 * Gets the date of the Monday of the current week.
 * @param {Date} [d=new Date()] - The date to calculate the start of the week from.
 * @returns {Date} The date of the Monday of the week.
 */
function getStartOfWeek(d = new Date()) {
    const date = new Date(d);
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

/**
 * Returns the short day string (e.g., 'Mon') for a date.
 * @param {Date} [date=new Date()] - The date to format.
 * @returns {string} The three-letter day string.
 */
function getDayString(date = new Date()) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
}

/**
 * Formats a date object into a more readable string.
 * @param {Date} date - The date to format.
 * @param {object} [options={ month: 'long', day: 'numeric' }] - Formatting options.
 * @returns {string} The formatted date string.
 */
function formatDate(date, options = { month: 'long', day: 'numeric' }) {
    return date.toLocaleDateString(undefined, options);
}

/**
 * Gets the authentication token from localStorage
 * @returns {string|null} The auth token or null if not found
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Logout function to clear authentication data and redirect to login
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userDream');
    window.location.href = 'index.html';
}

/**
 * Check if token is expired and redirect to login if needed
 */
function checkTokenExpiration() {
    const token = getAuthToken();
    if (!token) {
        logout();
        return;
    }
    
    // If we get 401 responses, it means token is expired
    // This will be handled by the API calls themselves
}

/**
 * Authenticated fetch wrapper that handles 401 responses
 */
async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    if (!token) {
        console.log('No auth token found, redirecting to login');
        logout();
        throw new Error('No authentication token');
    }

    // Add authorization header
    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const response = await fetch(url, authOptions);
        
        // Handle 401 responses (token expired)
        if (response.status === 401) {
            console.log('Token expired (401), redirecting to login');
            logout();
            throw new Error('Authentication failed - token expired');
        }
        
        return response;
    } catch (error) {
        // If it's a network error, rethrow it
        if (!error.message.includes('Authentication failed')) {
            throw error;
        }
        throw error;
    }
}

// Make authenticatedFetch available globally
window.authenticatedFetch = authenticatedFetch;

// Make logout available globally for navigation
window.logout = logout;

// Note: In a real module-based system, you would use export.
// For this project, we'll include scripts in the HTML files directly.
// export { redirectIfNoToken, getStartOfWeek, formatDate, getAuthToken, logout };

// Mobile navigation toggle handler
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            links.classList.toggle('hidden');
        });
    }
});
