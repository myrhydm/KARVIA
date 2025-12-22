/**
 * User Profile Management System
 * Handles user information, preferences, resume upload, and vision quest
 */

class UserProfileManager {
    constructor() {
        this.apiBase = '/api';
        this.currentUser = null;
        this.isEditing = {
            basicInfo: false,
            preferences: false
        };
        this.originalData = {};
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing user profile...');
            this.showLoading();
            console.log('Loading user data...');
            await this.loadUserData();
            console.log('Loading user stats...');
            await this.loadUserStats();
            console.log('Rendering user profile...');
            this.renderUserProfile();
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            console.log('Loading vision quest...');
            await this.loadVisionQuest();
            console.log('User profile initialization complete');
            this.checkVisionPopulation();
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing user profile:', error);
            this.hideLoading();
            
            // Don't show error if it's just a missing auth token (user will be redirected)
            if (error.message !== 'No authentication token found') {
                this.showError('Failed to load user profile. Please try again.');
            }
        }
    }

    async loadUserData() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No auth token found, redirecting to login');
            window.location.href = 'login.html';
            throw new Error('No authentication token found');
        }

        try {
            const response = await fetch(`${this.apiBase}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.success ? result.data : result;
                this.needsVisionPopulation = result.needsVisionPopulation;
                console.log('User data loaded:', this.currentUser);
                console.log('Needs vision population:', this.needsVisionPopulation);
            } else {
                throw new Error('Failed to load user profile');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Set default user data
            this.currentUser = {
                email: 'user@example.com',
                name: 'User',
                fullName: '',
                phone: '',
                location: '',
                bio: '',
                createdAt: new Date(),
                preferences: {
                    learningStyle: 'hands-on',
                    timeCommitment: 'moderate',
                    notifications: {
                        dailyReminders: true,
                        progressUpdates: true,
                        motivationQuotes: false
                    }
                }
            };
        }
    }

    async loadUserStats() {
        try {
            const token = localStorage.getItem('authToken');
            
            // Use the dedicated user stats API instead of individual endpoints
            const statsResponse = await fetch(`${this.apiBase}/users/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                if (statsData.success && statsData.data) {
                    this.userStats = {
                        journeyCount: statsData.data.journeysCreated || 0,
                        goalsAchieved: statsData.data.goalsAchieved || 0,
                        currentStreak: statsData.data.currentStreak || 0,
                        totalXP: statsData.data.totalXP || 0
                    };
                } else {
                    throw new Error('Invalid stats response format');
                }
            } else {
                throw new Error(`Stats API returned ${statsResponse.status}`);
            }
            
        } catch (error) {
            console.error('Error loading user stats:', error);
            // Set default stats if API fails
            this.userStats = {
                journeyCount: 0,
                goalsAchieved: 0,
                currentStreak: 0,
                totalXP: 0
            };
        }
    }

    renderUserProfile() {
        // Update basic info
        const initials = this.getInitials(this.currentUser.fullName || this.currentUser.name || this.currentUser.email);
        document.getElementById('profile-avatar').textContent = initials;
        
        document.getElementById('full-name').value = this.currentUser.fullName || this.currentUser.name || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('phone').value = this.currentUser.phone || '';
        document.getElementById('location').value = this.currentUser.location || '';
        document.getElementById('bio').value = this.currentUser.bio || '';
        
        // Update professional assets
        document.getElementById('blog-url').value = this.currentUser.blogUrl || '';
        document.getElementById('twitter-handle').value = this.currentUser.twitterHandle || '';
        document.getElementById('side-projects').value = this.currentUser.sideProjects || '';
        
        // Update member since
        const memberSince = new Date(this.currentUser.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
        document.getElementById('member-since').textContent = memberSince;
        
        // Update preferences display
        this.updatePreferencesDisplay();
        
        // Update form values (for when editing)
        if (this.currentUser.preferences) {
            // Learning & Time preferences
            document.getElementById('learning-style').value = this.currentUser.preferences.learningStyle || 'hands-on';
            document.getElementById('time-commitment').value = this.currentUser.preferences.timeCommitment || 'focused';
            
            // Focus & Goals preferences
            document.getElementById('focus-area').value = this.currentUser.preferences.focusArea || 'skill-building';
            document.getElementById('challenge-level').value = this.currentUser.preferences.challengeLevel || 'balanced';
            
            // Work Style preferences
            document.getElementById('collaboration-style').value = this.currentUser.preferences.collaborationStyle || 'solo';
            document.getElementById('accountability-type').value = this.currentUser.preferences.accountabilityType || 'self-directed';
            
            // Notification preferences
            if (this.currentUser.preferences.notifications) {
                document.getElementById('daily-reminders').checked = this.currentUser.preferences.notifications.dailyReminders || false;
                document.getElementById('progress-updates').checked = this.currentUser.preferences.notifications.progressUpdates || false;
                document.getElementById('motivation-quotes').checked = this.currentUser.preferences.notifications.motivationQuotes || false;
                document.getElementById('milestone-celebrations').checked = this.currentUser.preferences.notifications.milestoneCelebrations || false;
            }
        }
        
        // Update stats
        if (this.userStats) {
            document.getElementById('journeys-count').textContent = this.userStats.journeyCount;
            document.getElementById('goals-achieved').textContent = this.userStats.goalsAchieved;
            document.getElementById('current-streak').textContent = `${this.userStats.currentStreak} days`;
            document.getElementById('total-xp').textContent = this.userStats.totalXP;
            
            // Update progress ring
            const completionPercentage = this.calculateCompletionPercentage();
            this.updateProgressRing(completionPercentage);
        }
    }

    getInitials(name) {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    calculateCompletionPercentage() {
        if (!this.userStats) return 0;
        
        // Simple calculation based on goals achieved and XP
        const maxGoals = 20; // Assume max 20 goals for calculation
        const maxXP = 1000; // Assume max 1000 XP for calculation
        
        const goalProgress = Math.min((this.userStats.goalsAchieved / maxGoals) * 50, 50);
        const xpProgress = Math.min((this.userStats.totalXP / maxXP) * 50, 50);
        
        return Math.round(goalProgress + xpProgress);
    }

    updateProgressRing(percentage) {
        const circle = document.getElementById('progress-circle');
        const circumference = 2 * Math.PI * 40; // r = 40
        const offset = circumference - (percentage / 100) * circumference;
        
        circle.style.strokeDashoffset = offset;
        document.getElementById('completion-percentage').textContent = `${percentage}%`;
    }

    setupEventListeners() {
        // Basic Info Edit
        const editBasicBtn = document.getElementById('edit-basic-info');
        if (editBasicBtn) {
            editBasicBtn.addEventListener('click', () => {
                this.toggleEditMode('basicInfo');
            });
        }
        
        const saveBasicBtn = document.getElementById('save-basic-info');
        if (saveBasicBtn) {
            saveBasicBtn.addEventListener('click', () => {
                this.saveBasicInfo();
            });
        }
        
        const cancelBasicBtn = document.getElementById('cancel-basic-info');
        if (cancelBasicBtn) {
            cancelBasicBtn.addEventListener('click', () => {
                this.cancelEdit('basicInfo');
            });
        }
        
        // Preferences Edit
        const editPrefBtn = document.getElementById('edit-preferences');
        if (editPrefBtn) {
            editPrefBtn.addEventListener('click', () => {
                this.toggleEditMode('preferences');
            });
        }
        
        const savePrefBtn = document.getElementById('save-preferences');
        if (savePrefBtn) {
            savePrefBtn.addEventListener('click', () => {
                this.savePreferences();
            });
        }
        
        const cancelPrefBtn = document.getElementById('cancel-preferences');
        if (cancelPrefBtn) {
            cancelPrefBtn.addEventListener('click', () => {
                this.cancelEdit('preferences');
            });
        }
        
        // Resume Upload
        this.setupResumeUpload();
        
        // Vision Quest
        const visionBtn = document.getElementById('start-vision-quest');
        if (visionBtn) {
            visionBtn.addEventListener('click', () => {
                this.startVisionQuest();
            });
        }
        
        // Quick Actions (optional elements)
        const retakeBtn = document.getElementById('retake-assessment');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => {
                this.retakeAssessment();
            });
        }
        
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportUserData();
            });
        }
    }

    toggleEditMode(section) {
        this.isEditing[section] = !this.isEditing[section];
        
        if (section === 'basicInfo') {
            const inputs = ['full-name', 'email', 'phone', 'location', 'bio', 'blog-url', 'twitter-handle', 'side-projects'];
            inputs.forEach(id => {
                document.getElementById(id).readOnly = !this.isEditing[section];
            });
            
            document.getElementById('basic-info-actions').classList.toggle('hidden', !this.isEditing[section]);
            
            if (this.isEditing[section]) {
                this.originalData.basicInfo = {
                    fullName: document.getElementById('full-name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    location: document.getElementById('location').value,
                    bio: document.getElementById('bio').value,
                    blogUrl: document.getElementById('blog-url').value,
                    twitterHandle: document.getElementById('twitter-handle').value,
                    sideProjects: document.getElementById('side-projects').value
                };
            }
        } else if (section === 'preferences') {
            // All journey preference fields
            const selects = ['learning-style', 'time-commitment', 'focus-area', 'challenge-level', 'collaboration-style', 'accountability-type'];
            const checkboxes = ['daily-reminders', 'progress-updates', 'motivation-quotes', 'milestone-celebrations'];
            
            // Toggle between display and form
            const displayElement = document.getElementById('preferences-display');
            const formElement = document.getElementById('preferences-form');
            
            if (this.isEditing[section]) {
                // Show form, hide display
                displayElement.classList.add('hidden');
                formElement.classList.remove('hidden');
                
                // Enable form elements
                selects.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.disabled = false;
                });
                
                checkboxes.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.disabled = false;
                });
            } else {
                // Show display, hide form
                displayElement.classList.remove('hidden');
                formElement.classList.add('hidden');
                
                // Update the display with current values
                this.updatePreferencesDisplay();
                
                // Disable form elements
                selects.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.disabled = true;
                });
                
                checkboxes.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) element.disabled = true;
                });
            }
            
            document.getElementById('preferences-actions').classList.toggle('hidden', !this.isEditing[section]);
            
            if (this.isEditing[section]) {
                this.originalData.preferences = {
                    learningStyle: document.getElementById('learning-style').value,
                    timeCommitment: document.getElementById('time-commitment').value,
                    focusArea: document.getElementById('focus-area').value,
                    challengeLevel: document.getElementById('challenge-level').value,
                    collaborationStyle: document.getElementById('collaboration-style').value,
                    accountabilityType: document.getElementById('accountability-type').value,
                    dailyReminders: document.getElementById('daily-reminders').checked,
                    progressUpdates: document.getElementById('progress-updates').checked,
                    motivationQuotes: document.getElementById('motivation-quotes').checked,
                    milestoneCelebrations: document.getElementById('milestone-celebrations').checked
                };
            }
        }
    }

    async saveBasicInfo() {
        try {
            const data = {
                fullName: document.getElementById('full-name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                location: document.getElementById('location').value,
                bio: document.getElementById('bio').value,
                blogUrl: document.getElementById('blog-url').value,
                twitterHandle: document.getElementById('twitter-handle').value,
                sideProjects: document.getElementById('side-projects').value
            };
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                this.currentUser = { ...this.currentUser, ...data };
                this.toggleEditMode('basicInfo');
                this.showSuccess('Profile updated successfully!');
                
                // Update avatar
                const initials = this.getInitials(data.fullName);
                document.getElementById('profile-avatar').textContent = initials;
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving basic info:', error);
            this.showError('Failed to update profile. Please try again.');
        }
    }

    /**
     * Update the preferences display
     */
    updatePreferencesDisplay() {
        const displayContainer = document.getElementById('preferences-display');
        if (displayContainer) {
            displayContainer.innerHTML = this.createPreferenceDisplay();
        }
    }

    /**
     * Format preference values for professional display
     */
    formatPreferenceValue(key, value) {
        const formatMap = {
            learningStyle: {
                'hands-on': 'Hands-on',
                'research': 'Research First',
                'community': 'Community Learning',
                'structured': 'Structured Curriculum',
                'visual': 'Visual Learning',
                'reading': 'Reading Based',
                'discussion': 'Discussion Based'
            },
            timeCommitment: {
                'micro': 'Micro Bursts (15-30 min)',
                'focused': 'Focused Blocks (1-2 hours)', 
                'flexible': 'Flexible Flow',
                'intensive': 'Intensive (2+ hours)',
                'light': 'Light Commitment',
                'moderate': 'Moderate Commitment',
                'focused-blocks': 'Focused Blocks'
            },
            focusArea: {
                'get-job': 'Get a Job',
                'build-business': 'Build Business',
                'get-promotion': 'Get Promotion/Raise',
                'skill-building': 'Skill Building',
                'career-change': 'Career Change',
                'freelance': 'Freelance/Consulting'
            },
            challengeLevel: {
                'easy-wins': 'Easy Wins',
                'balanced': 'Balanced',
                'stretch': 'Stretch Goals',
                'ambitious': 'Ambitious'
            },
            collaborationStyle: {
                'solo': 'Solo Player',
                'small-group': 'Small Groups',
                'community': 'Community Driven',
                'mentorship': 'Mentorship'
            },
            accountabilityType: {
                'self-directed': 'Self-Directed',
                'check-ins': 'Regular Check-ins',
                'peer-buddy': 'Peer Buddy',
                'coach': 'Coach/Mentor'
            }
        };

        return formatMap[key]?.[value] || value;
    }

    /**
     * Create professional display for preferences when not editing
     */
    createPreferenceDisplay() {
        if (!this.currentUser.preferences) return '';

        const prefs = this.currentUser.preferences;
        
        return `
            <div class="space-y-4">
                <!-- Learning & Time -->
                <div class="border-b border-gray-100 pb-3">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">📚 Learning & Time</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span class="text-gray-600">Learning Style:</span> <span class="font-medium">${this.formatPreferenceValue('learningStyle', prefs.learningStyle)}</span></div>
                        <div><span class="text-gray-600">Time Commitment:</span> <span class="font-medium">${this.formatPreferenceValue('timeCommitment', prefs.timeCommitment)}</span></div>
                    </div>
                </div>

                <!-- Focus & Goals -->
                <div class="border-b border-gray-100 pb-3">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">🎯 Current Focus</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span class="text-gray-600">Focus Area:</span> <span class="font-medium">${this.formatPreferenceValue('focusArea', prefs.focusArea)}</span></div>
                        <div><span class="text-gray-600">Challenge Level:</span> <span class="font-medium">${this.formatPreferenceValue('challengeLevel', prefs.challengeLevel)}</span></div>
                    </div>
                </div>

                <!-- Work Style -->
                <div class="border-b border-gray-100 pb-3">
                    <h4 class="text-sm font-medium text-gray-900 mb-2">🤝 Work Style</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span class="text-gray-600">Collaboration Style:</span> <span class="font-medium">${this.formatPreferenceValue('collaborationStyle', prefs.collaborationStyle)}</span></div>
                        <div><span class="text-gray-600">Accountability Type:</span> <span class="font-medium">${this.formatPreferenceValue('accountabilityType', prefs.accountabilityType)}</span></div>
                    </div>
                </div>

                <!-- Notifications -->
                <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-2">🔔 Notifications</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span class="text-gray-600">Daily Reminders:</span> <span class="font-medium">${prefs.notifications?.dailyReminders ? 'Enabled' : 'Disabled'}</span></div>
                        <div><span class="text-gray-600">Progress Updates:</span> <span class="font-medium">${prefs.notifications?.progressUpdates ? 'Enabled' : 'Disabled'}</span></div>
                        <div><span class="text-gray-600">Motivation Quotes:</span> <span class="font-medium">${prefs.notifications?.motivationQuotes ? 'Enabled' : 'Disabled'}</span></div>
                        <div><span class="text-gray-600">Milestone Celebrations:</span> <span class="font-medium">${prefs.notifications?.milestoneCelebrations ? 'Enabled' : 'Disabled'}</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    async savePreferences() {
        try {
            // Validate all required elements exist
            const elements = [
                'learning-style', 'time-commitment', 'focus-area', 'challenge-level',
                'collaboration-style', 'accountability-type', 'daily-reminders',
                'progress-updates', 'motivation-quotes', 'milestone-celebrations'
            ];
            
            for (const id of elements) {
                if (!document.getElementById(id)) {
                    throw new Error(`Element with id '${id}' not found`);
                }
            }
            
            const data = {
                preferences: {
                    // Learning & Time preferences
                    learningStyle: document.getElementById('learning-style').value,
                    timeCommitment: document.getElementById('time-commitment').value,
                    
                    // Focus & Goals preferences  
                    focusArea: document.getElementById('focus-area').value,
                    challengeLevel: document.getElementById('challenge-level').value,
                    
                    // Work Style preferences
                    collaborationStyle: document.getElementById('collaboration-style').value,
                    accountabilityType: document.getElementById('accountability-type').value,
                    
                    // Notification preferences
                    notifications: {
                        dailyReminders: document.getElementById('daily-reminders').checked,
                        progressUpdates: document.getElementById('progress-updates').checked,
                        motivationQuotes: document.getElementById('motivation-quotes').checked,
                        milestoneCelebrations: document.getElementById('milestone-celebrations').checked
                    }
                }
            };
            
            console.log('Saving preferences:', data);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                this.currentUser.preferences = data.preferences;
                this.toggleEditMode('preferences');
                this.showSuccess('Preferences updated successfully!');
            } else {
                throw new Error('Failed to update preferences');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            this.showError('Failed to update preferences. Please try again.');
        }
    }

    cancelEdit(section) {
        if (section === 'basicInfo' && this.originalData.basicInfo) {
            document.getElementById('full-name').value = this.originalData.basicInfo.fullName;
            document.getElementById('email').value = this.originalData.basicInfo.email;
            document.getElementById('phone').value = this.originalData.basicInfo.phone;
            document.getElementById('location').value = this.originalData.basicInfo.location;
            document.getElementById('bio').value = this.originalData.basicInfo.bio;
            document.getElementById('blog-url').value = this.originalData.basicInfo.blogUrl;
            document.getElementById('twitter-handle').value = this.originalData.basicInfo.twitterHandle;
            document.getElementById('side-projects').value = this.originalData.basicInfo.sideProjects;
        } else if (section === 'preferences' && this.originalData.preferences) {
            // Restore all journey preferences
            document.getElementById('learning-style').value = this.originalData.preferences.learningStyle;
            document.getElementById('time-commitment').value = this.originalData.preferences.timeCommitment;
            document.getElementById('focus-area').value = this.originalData.preferences.focusArea;
            document.getElementById('challenge-level').value = this.originalData.preferences.challengeLevel;
            document.getElementById('collaboration-style').value = this.originalData.preferences.collaborationStyle;
            document.getElementById('accountability-type').value = this.originalData.preferences.accountabilityType;
            document.getElementById('daily-reminders').checked = this.originalData.preferences.dailyReminders;
            document.getElementById('progress-updates').checked = this.originalData.preferences.progressUpdates;
            document.getElementById('motivation-quotes').checked = this.originalData.preferences.motivationQuotes;
            document.getElementById('milestone-celebrations').checked = this.originalData.preferences.milestoneCelebrations;
        }
        
        this.toggleEditMode(section);
    }

    setupResumeUpload() {
        const uploadArea = document.getElementById('resume-upload-area');
        const fileInput = document.getElementById('resume-file-input');
        const selectBtn = document.getElementById('select-resume-btn');
        
        // Only set up events if elements exist
        if (uploadArea && fileInput && selectBtn) {
            // Click to select file
            selectBtn.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('click', () => fileInput.click());
            
            // File input change
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
            
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                if (e.dataTransfer.files.length > 0) {
                    this.handleFileUpload(e.dataTransfer.files[0]);
                }
            });
        } else {
            console.warn('Resume upload elements not found, skipping setup');
        }
        
        // Load existing files
        this.loadUploadedFiles();
    }

    async handleFileUpload(file) {
        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            this.showError('Please upload a PDF or Word document.');
            return;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.showError('File size must be less than 5MB.');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('resume', file);
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/users/resume`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (response.ok) {
                this.showSuccess('Resume uploaded successfully!');
                this.loadUploadedFiles();
            } else {
                throw new Error('Failed to upload resume');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            this.showError('Failed to upload resume. Please try again.');
        }
    }

    async loadUploadedFiles() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/users/resume`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    this.renderUploadedFiles(result.data);
                }
            }
        } catch (error) {
            console.error('Error loading uploaded files:', error);
        }
    }

    renderUploadedFiles(files) {
        const container = document.getElementById('uploaded-files');
        
        if (!files || files.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No files uploaded yet.</p>';
            return;
        }
        
        container.innerHTML = files.map(file => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                    <svg class="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <div>
                        <div class="font-medium text-gray-900">${file.originalName}</div>
                        <div class="text-sm text-gray-500">Uploaded ${new Date(file.uploadedAt).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="userProfile.downloadFile('${file._id}')" class="text-blue-600 hover:text-blue-800">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </button>
                    <button onclick="userProfile.deleteFile('${file._id}')" class="text-red-600 hover:text-red-800">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async downloadFile(fileId) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/users/resume/${fileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'resume';
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            this.showError('Failed to download file.');
        }
    }

    async deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) return;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/users/resume/${fileId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                this.showSuccess('File deleted successfully!');
                this.loadUploadedFiles();
            } else {
                throw new Error('Failed to delete file');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            this.showError('Failed to delete file.');
        }
    }

    async loadVisionQuest() {
        try {
            const token = localStorage.getItem('authToken');
            
            // Check if user has completed vision assessment
            const visionResponse = await fetch(`${this.apiBase}/vision/results`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (visionResponse.ok) {
                const visionResult = await visionResponse.json();
                if (visionResult && visionResult.visionData) {
                    // Assessment completed - show results and retake option
                    this.visionData = visionResult;
                    document.getElementById('assessment-status').textContent = 'Completed';
                    this.renderCompletedVisionQuest();
                } else {
                    // Assessment not completed - show start option
                    document.getElementById('assessment-status').textContent = 'Not Started';
                    this.renderIncompleteVisionQuest();
                }
            } else if (visionResponse.status === 404) {
                // No vision data found - not started
                document.getElementById('assessment-status').textContent = 'Not Started';
                this.renderIncompleteVisionQuest();
            } else {
                throw new Error('Failed to load vision data');
            }
        } catch (error) {
            console.error('Error loading vision quest status:', error);
            document.getElementById('assessment-status').textContent = 'Not Started';
            this.renderIncompleteVisionQuest();
        }
    }

    renderIncompleteVisionQuest() {
        const content = document.getElementById('vision-quest-content');
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-white">Discover Your Vision</h3>
                        <p class="text-blue-100 text-sm">Take our comprehensive assessment to understand your goals and readiness level</p>
                    </div>
                </div>
                
                <div class="bg-white bg-opacity-10 rounded-lg p-4">
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-2xl font-bold text-white">15</div>
                            <div class="text-xs text-blue-100">Questions</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-white">~10</div>
                            <div class="text-xs text-blue-100">Minutes</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-white">✨</div>
                            <div class="text-xs text-blue-100">Personalized</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Update button to start assessment
        const button = document.getElementById('start-vision-quest');
        button.textContent = 'Start Vision Quest';
        button.onclick = () => this.startVisionQuestionnaire();
    }

    renderCompletedVisionQuest() {
        const content = document.getElementById('vision-quest-content');
        const completedDate = new Date(this.visionData.visionData.completedAt).toLocaleDateString();
        
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-white">Vision Assessment Complete</h3>
                        <p class="text-blue-100 text-sm">Completed on ${completedDate}</p>
                    </div>
                </div>
                
                <div class="bg-white bg-opacity-10 rounded-lg p-4">
                    <h4 class="text-white font-medium mb-3">Assessment Results:</h4>
                    <div class="space-y-2">
                        ${this.renderVisionResults()}
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="userProfile.viewDetailedResults()" class="flex-1 bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all duration-200">
                        View Details
                    </button>
                    <button onclick="userProfile.retakeVisionQuest()" class="flex-1 bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200">
                        Retake Assessment
                    </button>
                </div>
            </div>
        `;
        
        // Update main button
        const button = document.getElementById('start-vision-quest');
        button.textContent = 'View Full Results';
        button.onclick = () => this.viewDetailedResults();
    }

    renderVisionResults() {
        if (!this.visionData || !this.visionData.visionScore) {
            return '<div class="text-blue-100 text-sm">Results processing...</div>';
        }

        const score = this.visionData.visionScore;
        const results = [];

        if (score.readinessScore) {
            results.push(`<div class="flex justify-between text-sm">
                <span class="text-blue-100">Readiness Score:</span>
                <span class="text-white font-medium">${Math.round(score.readinessScore)}/100</span>
            </div>`);
        }

        if (score.visionClarity) {
            results.push(`<div class="flex justify-between text-sm">
                <span class="text-blue-100">Vision Clarity:</span>
                <span class="text-white font-medium">${Math.round(score.visionClarity)}/100</span>
            </div>`);
        }

        if (score.overallScore) {
            results.push(`<div class="flex justify-between text-sm">
                <span class="text-blue-100">Overall Score:</span>
                <span class="text-white font-medium">${Math.round(score.overallScore)}/100</span>
            </div>`);
        }

        return results.length > 0 ? results.join('') : '<div class="text-blue-100 text-sm">Assessment data available</div>';
    }

    startVisionQuestionnaire() {
        window.location.href = '/vision-questionnaire.html?from=profile';
    }

    viewDetailedResults() {
        // Create a detailed results modal or redirect to results page
        this.showVisionResultsModal();
    }

    retakeVisionQuest() {
        if (confirm('Are you sure you want to retake the vision assessment? This will replace your current results.')) {
            window.location.href = '/vision-questionnaire.html?retake=true&from=profile';
        }
    }

    showVisionResultsModal() {
        if (!this.visionData) {
            this.showError('No vision data available');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-gray-900">Vision Assessment Results</h2>
                        <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="space-y-6">
                        ${this.renderDetailedVisionResults()}
                    </div>
                    
                    <div class="mt-6 flex space-x-3">
                        <button onclick="userProfile.retakeVisionQuest()" class="btn btn-primary">Retake Assessment</button>
                        <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="btn btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    renderDetailedVisionResults() {
        if (!this.visionData) return '<p class="text-gray-600">No results available</p>';

        const { visionData, visionScore, visionFeedback } = this.visionData;
        let html = '';

        // Basic Info
        html += `
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold text-gray-900 mb-2">Assessment Overview</h3>
                <p class="text-sm text-gray-600">Completed: ${new Date(visionData.completedAt).toLocaleDateString()}</p>
            </div>
        `;

        // Scores
        if (visionScore) {
            html += `
                <div class="bg-blue-50 rounded-lg p-4">
                    <h3 class="font-semibold text-gray-900 mb-4">Your Scores</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${visionScore.readinessScore ? `
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600">${Math.round(visionScore.readinessScore)}</div>
                                <div class="text-sm text-gray-600">Readiness Score</div>
                            </div>
                        ` : ''}
                        ${visionScore.visionClarity ? `
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600">${Math.round(visionScore.visionClarity)}</div>
                                <div class="text-sm text-gray-600">Vision Clarity</div>
                            </div>
                        ` : ''}
                        ${visionScore.overallScore ? `
                            <div class="text-center">
                                <div class="text-2xl font-bold text-blue-600">${Math.round(visionScore.overallScore)}</div>
                                <div class="text-sm text-gray-600">Overall Score</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        // Feedback
        if (visionFeedback && visionFeedback.feedback) {
            html += `
                <div class="bg-green-50 rounded-lg p-4">
                    <h3 class="font-semibold text-gray-900 mb-2">Personalized Feedback</h3>
                    <p class="text-gray-700">${visionFeedback.feedback}</p>
                </div>
            `;
        }

        // Vision Summary
        if (visionData.responses) {
            html += `
                <div class="bg-purple-50 rounded-lg p-4">
                    <h3 class="font-semibold text-gray-900 mb-2">Your Vision</h3>
                    ${visionData.responses.dream ? `<p class="text-gray-700 mb-2"><strong>Dream:</strong> ${visionData.responses.dream}</p>` : ''}
                    ${visionData.responses.why ? `<p class="text-gray-700"><strong>Why:</strong> ${visionData.responses.why}</p>` : ''}
                </div>
            `;
        }

        return html || '<p class="text-gray-600">No detailed results available</p>';
    }

    // Legacy method for backward compatibility
    startVisionQuest() {
        this.startVisionQuestionnaire();
    }

    retakeAssessment() {
        this.retakeVisionQuest();
    }

    async exportUserData() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/users/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `manifestor-profile-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                window.URL.revokeObjectURL(url);
                
                this.showSuccess('Profile data exported successfully!');
            } else {
                throw new Error('Failed to export data');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Failed to export profile data.');
        }
    }

    // Utility methods
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        } else {
            console.warn('Loading overlay element not found');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        } else {
            console.warn('Loading overlay element not found');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Check if user needs preference population from Vision Quest
     */
    checkVisionPopulation() {
        if (this.needsVisionPopulation) {
            this.showVisionPopulationPrompt();
        }
    }

    /**
     * Show prompt to populate preferences from Vision Quest
     */
    showVisionPopulationPrompt() {
        const promptHtml = `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                        </svg>
                    </div>
                    <div class="ml-3 flex-1">
                        <h3 class="text-sm font-medium text-blue-800">
                            🎯 Smart Setup Available
                        </h3>
                        <p class="mt-1 text-sm text-blue-700">
                            We noticed you've completed your Vision Quest! We can automatically configure your Journey Preferences based on your assessment results to save you time.
                        </p>
                        <div class="mt-3 flex space-x-2">
                            <button onclick="userProfile.populateFromVision()" class="btn btn-primary text-sm">
                                Auto-Fill Preferences
                            </button>
                            <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="btn btn-secondary text-sm">
                                Skip for Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert the prompt before the preferences section
        const headerElement = Array.from(document.querySelectorAll('h2')).find(h2 => h2.textContent.includes('Journey Preferences'));
        const preferencesSection = headerElement?.closest('.profile-section') || 
                                   document.querySelector('.profile-section:last-child');
        
        if (preferencesSection) {
            preferencesSection.insertAdjacentHTML('beforebegin', promptHtml);
        }
    }

    /**
     * Populate preferences from Vision Quest data
     */
    async populateFromVision() {
        try {
            this.showLoading();
            
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBase}/users/preferences/populate-from-vision`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Update current user preferences
                this.currentUser.preferences = data.data;
                
                // Re-render the profile to show updated preferences
                this.renderUserProfile();
                
                // Remove the prompt
                const prompt = document.querySelector('.bg-blue-50');
                if (prompt) prompt.remove();
                
                this.showNotification('Journey Preferences auto-filled from your Vision Quest! 🎉', 'success');
                this.needsVisionPopulation = false;
            } else {
                this.showNotification(data.error || 'Failed to populate preferences', 'error');
            }
        } catch (error) {
            console.error('Error populating preferences from vision:', error);
            this.showNotification('Failed to populate preferences. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize when page loads
let userProfile;
document.addEventListener('DOMContentLoaded', () => {
    userProfile = new UserProfileManager();
});