/**
 * auth.js 
 * Handles login and signup form submission and token management.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing token and redirect if the user is already logged in
    if (localStorage.getItem('authToken')) {
        // Check if user has completed journey onboarding
        checkJourneyStatusAndRedirect();
        return;
    }

    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    const errorMessageDiv = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // --- View Toggling Logic ---
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.classList.add('hidden');
        signupView.classList.remove('hidden');
        errorMessageDiv.classList.add('hidden');
    });

    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupView.classList.add('hidden');
        loginView.classList.remove('hidden');
        errorMessageDiv.classList.add('hidden');
    });

    // --- Generic API Request Handler ---
    const handleApiRequest = async (url, body) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) {
                const message = data.msg || (data.errors && data.errors[0].msg) || 'An unknown error occurred.';
                throw new Error(message);
            }
            return data;
        } catch (error) {
            console.error("API request failed:", error);
            errorText.textContent = error.message;
            errorMessageDiv.classList.remove('hidden');
            return null;
        }
    };
    
    // --- Form Submission Event Listeners ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.classList.add('hidden');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const data = await handleApiRequest('/api/auth/login', { email, password });
        if (data && data.token) {
            localStorage.setItem('authToken', data.token);
            if (data.name) {
                localStorage.setItem('userName', data.name);
            }
            
            // Store user data in the format expected by navigation system
            localStorage.setItem('user', JSON.stringify({
                onboardingCompleted: data.onboardingCompleted,
                name: data.name,
                email: email
            }));
            
            // Redirect to journey page for first-time onboarding
            checkJourneyStatusAndRedirect();
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.classList.add('hidden');
        
        console.log('📝 Starting signup process...');
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        
        console.log('📋 Form data collected:', { name, email, password: '***' });
        
        const data = await handleApiRequest('/api/auth/signup', { name, email, password });
        
        console.log('🔄 API response received:', data ? 'Success' : 'Failed');
        
        if (data && data.token) {
            console.log('✅ Token received, storing user data...');
            
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userName', name);
            
            // Store user data in the format expected by navigation system
            localStorage.setItem('user', JSON.stringify({
                onboardingCompleted: data.onboardingCompleted || false,
                name: name,
                email: email
            }));
            
            console.log('💾 Data stored in localStorage');
            
            // Add a small delay to ensure localStorage is written
            setTimeout(() => {
                console.log('🚀 Redirecting to my journey page...');
                window.location.href = 'my_journey.html';
            }, 100);
        } else {
            console.error('❌ Signup failed - no token received');
            if (!data) {
                errorText.textContent = 'Signup failed. Please try again.';
                errorMessageDiv.classList.remove('hidden');
            }
        }
    });
});

/**
 * Check journey status and redirect appropriately
 */
async function checkJourneyStatusAndRedirect() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/dreams/active', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // If user has active dreams with generated plans, go to home page
            if (data.success && data.data && data.data.length > 0) {
                const hasGeneratedPlan = data.data.some(dream => dream.planGenerated);
                if (hasGeneratedPlan) {
                    console.log('User has generated plans - redirecting to dashboard');
                    // Update user status to prevent future routing conflicts
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    currentUser.onboardingCompleted = true;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                    
                    window.location.href = 'home.html';
                } else {
                    // Has dreams but no plan generated yet, go to my journey page
                    console.log('User has dreams but no generated plans - redirecting to my_journey');
                    window.location.href = 'my_journey.html';
                }
            } else {
                // New user or no dreams yet, go to my journey page
                console.log('New user or no dreams - redirecting to my_journey');
                window.location.href = 'my_journey.html';
            }
        } else {
            // If can't check status, default to my journey page for onboarding
            window.location.href = 'my_journey.html';
        }
    } catch (error) {
        console.error('Error checking journey status:', error);
        // Fallback to my journey page
        window.location.href = 'my_journey.html';
    }
}
