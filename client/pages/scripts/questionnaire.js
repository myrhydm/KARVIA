// Generic questionnaire logic shared by assessments
class Questionnaire {
    constructor(config) {
        this.config = config;
        this.questions = config.questions || [];
        this.currentQuestion = 0;
        this.answers = {};
        this.pendingHighlight = null;
        this.init();
    }

    async init() {
        await this.loadExistingResults();
        this.bindEvents();
        this.renderQuestion();
    }

    async loadExistingResults() {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const res = await fetch(this.config.resultsUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.responses) {
                    this.answers = { ...data.responses };
                    if (data.completedAt) this.showEditMode(data.completedAt);
                }
                if (data.scores) {
                    localStorage.setItem(this.config.resultsKey, JSON.stringify(data));
                    // Show View Results button if analysis exists
                    this.hasExistingAnalysis = true;
                }
            }
        } catch (err) {
            console.error('Failed to load existing results', err);
        }
    }

    showEditMode(completedAt) {
        const progressContainer = document.querySelector('.max-w-4xl .mb-8');
        if (!progressContainer) return;
        const date = new Date(completedAt).toLocaleDateString();
        const banner = document.createElement('div');
        banner.className = 'mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-blue-800 text-sm';
        banner.innerHTML = `<strong>Edit Mode:</strong> You're updating your ${this.config.name} from ${date}`;
        progressContainer.insertBefore(banner, progressContainer.firstChild);
    }

    bindEvents() {
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextQuestion());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevQuestion());

        const navToggle = document.getElementById('nav-toggle');
        const navLinks = document.getElementById('nav-links');
        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('hidden');
            });
        }
    }

    updateProgress() {
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('progress-text').textContent = `Step ${this.currentQuestion + 1} of ${this.questions.length}`;
    }

    renderQuestion() {
        const container = document.getElementById('questionnaire-container');
        const q = this.questions[this.currentQuestion];
        let html = `
            <div class="text-center mb-8">
                <h2 class="text-4xl font-bold text-gray-900 mb-4">${q.title}</h2>
                <p class="text-xl text-gray-600 mb-4">${q.subtitle}</p>
                ${q.context ? `<div class="max-w-3xl mx-auto p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl"><p class="text-gray-700 leading-relaxed">${q.context}</p></div>` : ''}
            </div>
            <div class="space-y-8">
        `;
        q.fields.forEach(f => { html += this.renderField(f); });
        html += '</div>';
        if (this.currentQuestion === this.questions.length - 1) html += this.renderCompletionSummary();
        container.innerHTML = html;
        this.bindFieldEvents();
        if (this.pendingHighlight) {
            this.highlightMissingFields(this.pendingHighlight);
            this.pendingHighlight = null;
        }
        this.updateProgress();
        this.updateNavigationButtons();
    }

    renderCompletionSummary() {
        const saved = localStorage.getItem(this.config.storageKey);
        return `
            <div class="mt-12 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl text-center">
                <div class="text-4xl mb-4">🎯</div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">${this.config.name} Complete!</h3>
                <p class="text-gray-700 mb-6">
                    You've thoughtfully completed all sections of your ${this.config.name.toLowerCase()}.
                    ${saved ? 'Your previous entry will be updated.' : 'This will be saved as your profile.'}
                </p>
            </div>`;
    }

    renderField(field) {
        let html = '';
        if (field.context) {
            html += `<div class="mb-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg"><p class="text-sm text-blue-800 italic">${field.context}</p></div>`;
        }
        switch (field.type) {
            case 'textarea':
                html += `<div class="mb-6"><label class="block text-lg font-semibold text-gray-900 mb-3">${field.label}</label><textarea id="${field.id}" placeholder="${field.placeholder}" class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors duration-300 resize-vertical min-h-[120px]" ${field.required ? 'required' : ''}>${this.answers[field.id] || ''}</textarea></div>`;
                break;
            case 'text':
                html += `<div class="mb-6"><label class="block text-lg font-semibold text-gray-900 mb-3">${field.label}</label><input type="text" id="${field.id}" value="${this.answers[field.id] || ''}" placeholder="${field.placeholder}" class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors duration-300" ${field.required ? 'required' : ''}/></div>`;
                break;
            case 'single-choice':
                html += `<div class="mb-6"><label class="block text-lg font-semibold text-gray-900 mb-4">${field.label}</label><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${field.options.map(o => `<div class="choice-card p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-300 ${this.answers[field.id] === o.value ? 'selected' : ''}" data-field="${field.id}" data-value="${o.value}"><div class="flex items-center gap-3 mb-2"><span class="text-2xl">${o.icon}</span><span class="font-medium">${o.label}</span></div>${o.description ? `<p class="text-sm text-gray-600 ml-11">${o.description}</p>` : ''}</div>`).join('')}</div></div>`;
                break;
            case 'multi-choice':
                const sel = this.answers[field.id] || [];
                html += `<div class="mb-6"><label class="block text-lg font-semibold text-gray-900 mb-4">${field.label}</label><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${field.options.map(o => `<div class="multi-choice-card p-3 border-2 border-gray-200 rounded-lg cursor-pointer transition-all duration-300 ${sel.includes(o.value) ? 'selected' : ''}" data-field="${field.id}" data-value="${o.value}"><div class="flex items-center gap-2 mb-1"><span class="text-lg">${o.icon}</span><span class="font-medium text-sm">${o.label}</span></div>${o.description ? `<p class="text-xs text-gray-600 ml-6">${o.description}</p>` : ''}</div>`).join('')}</div></div>`;
                break;
            case 'likert':
                html += `<div class="mb-6"><label class="block text-lg font-semibold text-gray-900 mb-4">${field.label}</label><div class="flex gap-2 justify-between">${[1,2,3,4,5].map(num => `<button class="likert-button flex-1 p-3 border-2 border-gray-200 rounded-lg transition-all duration-300 ${this.answers[field.id] === num ? 'selected' : ''}" data-field="${field.id}" data-value="${num}"><div class="text-center"><div class="font-bold text-lg">${num}</div><div class="text-xs text-gray-600">${field.labels[num-1]}</div></div></button>`).join('')}</div></div>`;
                break;
            case 'slider':
                html += `<div class="mb-6"><label class="block text-lg font-semibold text-gray-900 mb-4">${field.label}</label><div class="mb-4"><div class="flex justify-between text-gray-600 text-sm mb-2"><span>${field.min}%</span><span id="${field.id}-value" class="text-purple-600 font-bold text-lg">${this.answers[field.id] || field.default}%</span><span>${field.max}%</span></div><input type="range" id="${field.id}" min="${field.min}" max="${field.max}" value="${this.answers[field.id] || field.default}" class="slider-custom w-full"/></div><p class="text-gray-600 text-center">${field.description}</p></div>`;
                break;
            case 'belief-scale':
                html += `<div class="mb-6"><label class="block text-lg font-semibold text-gray-900 mb-4">${field.label}</label><div class="flex justify-center gap-4 mb-4">${[1,2,3,4,5,6,7].map(num => `<div class="belief-circle ${this.answers[field.id] === num ? 'selected' : ''}" data-field="${field.id}" data-value="${num}">${num}</div>`).join('')}</div><div class="flex justify-between text-sm text-gray-600"><span>Not at all</span><span>Completely certain</span></div></div>`;
                break;
            case 'file':
                html += `<div class="mb-6"><label class="block text-lg font-semibold text-gray-900 mb-3">${field.label}</label><div class="file-drop-zone p-8 rounded-xl text-center cursor-pointer"><div class="text-4xl mb-4">📄</div><p class="text-gray-600 mb-2">${field.placeholder}</p><p class="text-gray-400 text-sm">PDF, DOC, DOCX accepted</p><input type="file" id="${field.id}" accept=".pdf,.doc,.docx" class="hidden" /></div></div>`;
                break;
            default:
                break;
        }
        return html;
    }

    bindFieldEvents() {
        document.querySelectorAll('.choice-card').forEach(card => {
            card.addEventListener('click', () => {
                const field = card.dataset.field;
                const value = card.dataset.value;
                document.querySelectorAll(`[data-field="${field}"]`).forEach(el => el.classList.remove('selected'));
                card.classList.add('selected');
                this.answers[field] = value;
                this.updateNavigationButtons();
            });
        });
        document.querySelectorAll('.multi-choice-card').forEach(card => {
            card.addEventListener('click', () => {
                const field = card.dataset.field;
                const value = card.dataset.value;
                if (!this.answers[field]) this.answers[field] = [];
                if (this.answers[field].includes(value)) {
                    this.answers[field] = this.answers[field].filter(v => v !== value);
                    card.classList.remove('selected');
                } else {
                    this.answers[field].push(value);
                    card.classList.add('selected');
                }
                this.updateNavigationButtons();
            });
        });
        document.querySelectorAll('.likert-button').forEach(button => {
            button.addEventListener('click', () => {
                const field = button.dataset.field;
                const value = parseInt(button.dataset.value);
                document.querySelectorAll(`[data-field="${field}"]`).forEach(el => el.classList.remove('selected'));
                button.classList.add('selected');
                this.answers[field] = value;
                this.updateNavigationButtons();
            });
        });
        document.querySelectorAll('.belief-circle').forEach(circle => {
            circle.addEventListener('click', () => {
                const field = circle.dataset.field;
                const value = parseInt(circle.dataset.value);
                document.querySelectorAll(`[data-field="${field}"]`).forEach(el => el.classList.remove('selected'));
                circle.classList.add('selected');
                this.answers[field] = value;
                this.updateNavigationButtons();
            });
        });
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            slider.addEventListener('input', e => {
                const valueEl = document.getElementById(`${slider.id}-value`);
                if (valueEl) valueEl.textContent = `${e.target.value}%`;
                this.answers[slider.id] = parseInt(e.target.value);
            });
        });
        document.querySelectorAll('.file-drop-zone').forEach(zone => {
            const input = zone.querySelector('input[type="file"]');
            zone.addEventListener('click', () => input && input.click());
            if (input) {
                input.addEventListener('change', e => {
                    this.answers[input.id] = e.target.files[0];
                });
            }
        });
        document.querySelectorAll('textarea, input[type="text"]').forEach(el => {
            el.addEventListener('input', () => {
                this.answers[el.id] = el.value;
                this.updateNavigationButtons();
            });
        });
    }

    isQuestionAnswered(question) {
        const required = question.fields.filter(f => f.required);
        return required.every(f => {
            const ans = this.answers[f.id];
            if (f.type === 'multi-choice') return ans && ans.length > 0;
            return ans !== undefined && ans !== null && ans !== '';
        });
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        if (!prevBtn || !nextBtn) return;
        prevBtn.disabled = this.currentQuestion === 0;
        const q = this.questions[this.currentQuestion];
        const answered = this.isQuestionAnswered(q);
        if (this.currentQuestion === this.questions.length - 1) {
            nextBtn.style.display = 'none';
            this.showFinalPageButtons();
        } else {
            nextBtn.textContent = answered ? 'Next →' : 'Answer Required Fields';
            nextBtn.disabled = !answered;
            nextBtn.style.display = 'block';
        }
    }

    showFinalPageButtons() {
        const container = document.getElementById('final-buttons');
        if (!container) return;
        container.classList.remove('hidden');
        
        // Hide the regular navigation buttons
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        if (nextBtn) nextBtn.style.display = 'none';
        if (prevBtn) prevBtn.style.display = 'none';
        
        // Previous button for final page
        const prevBtnFinal = document.getElementById('prev-btn-final');
        if (prevBtnFinal) {
            prevBtnFinal.addEventListener('click', () => this.prevQuestion());
        }
        
        // Save Vision button - only saves
        const saveBtn = document.getElementById('save-vision-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAssessment());
        }
        
        // Generate AI Analysis button - only analyzes
        const analyzeBtn = document.getElementById('analyze-vision-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', async () => {
                await this.analyzeOnly();
                // Show the View Results button after analysis
                const viewResultsBtn = document.getElementById('view-results-btn');
                if (viewResultsBtn) {
                    viewResultsBtn.classList.remove('hidden');
                }
            });
        }
        
        // View Results button - shows results and completes onboarding
        const viewResultsBtn = document.getElementById('view-results-btn');
        if (viewResultsBtn) {
            viewResultsBtn.addEventListener('click', () => this.viewResultsAndCompleteOnboarding());
            // Show the button if analysis already exists
            if (this.hasExistingAnalysis) {
                viewResultsBtn.classList.remove('hidden');
            }
        }
    }

    async analyzeOnly() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please log in to analyze');
            return;
        }
        
        // Check if data is already saved
        const savedData = localStorage.getItem(this.config.storageKey);
        if (!savedData) {
            // Save first if not already saved
            await this.saveAssessment();
        }
        
        // Analyze the data
        const analysisSuccess = await this.analyzeAssessment();
        if (analysisSuccess) {
            alert('Analysis completed successfully! You can now view results.');
        }
    }

    async viewResults() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please log in to view results');
            return;
        }
        
        try {
            const res = await fetch(this.config.resultsUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                throw new Error('Failed to fetch results');
            }
            
            const data = await res.json();
            this.displayResults(data);
            
        } catch (err) {
            console.error('Failed to load results', err);
            alert(`Failed to load results: ${err.message}. Please try again.`);
        }
    }

    async viewResultsAndCompleteOnboarding() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please log in to view results');
            return;
        }
        
        try {
            // First save the assessment if not already saved
            const savedData = localStorage.getItem(this.config.storageKey);
            if (!savedData) {
                await this.saveAssessment();
            }
            
            // Mark onboarding as completed
            await this.completeOnboarding();
            
            // Check if we came from user profile page
            const urlParams = new URLSearchParams(window.location.search);
            const returnToProfile = urlParams.get('from') === 'profile' || document.referrer.includes('user_profile.html');
            
            // Redirect to appropriate page
            if (returnToProfile) {
                window.location.href = 'user_profile.html';
            } else {
                window.location.href = 'analysis.html';
            }
            
        } catch (err) {
            console.error('Failed to complete onboarding', err);
            alert(`Failed to complete onboarding: ${err.message}. Please try again.`);
        }
    }

    async completeOnboarding() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        try {
            const response = await fetch('/api/auth/complete-onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    completedVisionQuestionnaire: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to complete onboarding');
            }

            // Update user data in localStorage in the format expected by navigation system
            const existingUser = localStorage.getItem('user');
            let userData = {};
            
            try {
                userData = existingUser ? JSON.parse(existingUser) : {};
            } catch (error) {
                console.error('Error parsing existing user data:', error);
            }
            
            // Update the onboarding status
            userData.onboardingCompleted = true;
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Also keep the legacy onboardingCompleted for compatibility
            localStorage.setItem('onboardingCompleted', 'true');
            
        } catch (error) {
            console.error('Error completing onboarding:', error);
            throw error;
        }
    }

    nextQuestion() {
        const q = this.questions[this.currentQuestion];
        const missing = q.fields.filter(f => f.required && ((f.type === 'multi-choice' && (!this.answers[f.id] || this.answers[f.id].length === 0)) || (this.answers[f.id] === undefined || this.answers[f.id] === '' || this.answers[f.id] === null)));
        if (missing.length > 0) {
            this.highlightMissingFields(missing.map(f => f.id));
            return;
        }
        if (this.currentQuestion < this.questions.length - 1) {
            this.currentQuestion++;
            this.renderQuestion();
        }
    }

    prevQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.renderQuestion();
        }
    }

    highlightMissingFields(ids = []) {
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('border-red-500');
        });
    }

    async saveAssessment() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please log in to save');
            return;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('save-vision-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        try {
            let body;
            let headers = { 'Authorization': `Bearer ${token}` };
            if (this.config.useFormData) {
                body = new FormData();
                body.append('responses', JSON.stringify(this.answers));
                if (this.answers.resume) body.append('resume', this.answers.resume);
            } else {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify({ responses: this.answers });
            }
            const res = await fetch(this.config.saveUrl, { method: 'POST', headers, body });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save');
            }
            
            await res.json();
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.answers));
            
            // Show success message
            saveBtn.textContent = 'Saved Successfully! ✓';
            saveBtn.className = 'px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-300';
            
            // Reset button after 3 seconds
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.className = 'px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300';
                saveBtn.disabled = false;
            }, 3000);
            
        } catch (err) {
            console.error('Save failed', err);
            
            // Show error message
            saveBtn.textContent = 'Save Failed - Try Again';
            saveBtn.className = 'px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all duration-300';
            saveBtn.disabled = false;
            
            // Reset button after 3 seconds
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.className = 'px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300';
            }, 3000);
            
            // Show user-friendly error
            alert(`Failed to save: ${err.message}. Please try again.`);
        }
    }

    async analyzeAssessment() {
        if (!this.config.analyzeUrl) return false;
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please log in to analyze');
            return false;
        }
        
        // Show loading state
        const analyzeBtn = document.getElementById('analyze-vision-btn');
        if (analyzeBtn) {
            const originalText = analyzeBtn.textContent;
            analyzeBtn.textContent = 'Analyzing...';
            analyzeBtn.disabled = true;
            
            try {
                let body;
                let headers = { 'Authorization': `Bearer ${token}` };
                if (this.config.useFormData) {
                    body = new FormData();
                    body.append('responses', JSON.stringify(this.answers));
                    if (this.answers.resume) body.append('resume', this.answers.resume);
                } else {
                    headers['Content-Type'] = 'application/json';
                    body = JSON.stringify({ responses: this.answers });
                }
                
                const res = await fetch(this.config.analyzeUrl, { method: 'POST', headers, body });
                
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Analysis failed');
                }
                
                // Reset button
                analyzeBtn.textContent = originalText;
                analyzeBtn.disabled = false;
                return true;
                
            } catch (err) {
                console.error('Analysis failed', err);
                
                // Show error state
                analyzeBtn.textContent = 'Analysis Failed - Try Again';
                analyzeBtn.className = 'px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all duration-300';
                analyzeBtn.disabled = false;
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    analyzeBtn.textContent = originalText;
                    analyzeBtn.className = 'px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all duration-300';
                }, 3000);
                
                alert(`Analysis failed: ${err.message}. Please try again.`);
                return false;
            }
        }
        return false;
    }

    async showResults() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please log in to view results');
            return;
        }
        
        // Check if data is already saved
        const savedData = localStorage.getItem(this.config.storageKey);
        if (!savedData) {
            // Save first if not already saved
            await this.saveAssessment();
        }
        
        // Analyze the data
        const analysisSuccess = await this.analyzeAssessment();
        if (!analysisSuccess) {
            return; // Analysis failed, don't proceed
        }
        
        // Small delay to ensure analysis is complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
            const res = await fetch(this.config.resultsUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!res.ok) {
                throw new Error('Failed to fetch results');
            }
            
            const data = await res.json();
            this.displayResults(data);
            
        } catch (err) {
            console.error('Failed to load results', err);
            alert(`Failed to load results: ${err.message}. Please try again.`);
        }
    }

    displayResults(data) {
        localStorage.setItem(this.config.resultsKey, JSON.stringify(data));
        const modal = document.getElementById('results-modal');
        if (!modal) return;
        const content = modal.querySelector('.bg-white');
        const scores = data.scores || {};
        content.innerHTML = `
            <div class="text-center mb-8">
                <h2 class="text-4xl font-bold text-gray-900 mb-4">🎯 Your ${this.config.name} Profile</h2>
            </div>
            <div id="scores-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                ${this.renderScoreCard('🔥', 'Motivation', scores.motivation || 0, 'red')}
                ${this.renderScoreCard('🚀', 'Readiness', scores.readiness || 0, 'blue')}
                ${this.renderScoreCard('🧠', 'Experience', scores.experience || 0, 'green')}
                ${this.renderScoreCard('💪', 'Confidence', scores.confidence || 0, 'purple')}
            </div>
            <div class="text-center mb-8 p-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border-2 border-purple-200">
                <h3 class="text-2xl font-bold text-gray-900 mb-4">Overall Score</h3>
                <div class="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">${Math.round(scores.overall || 0)}%</div>
            </div>
            <div class="flex justify-center space-x-4">
                <button id="retake-btn" class="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-all duration-300">Retake</button>
                <button id="close-btn" class="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300">Close</button>
            </div>`;
        modal.classList.remove('hidden');
        content.querySelector('#retake-btn').addEventListener('click', () => this.restart());
        content.querySelector('#close-btn').addEventListener('click', () => modal.classList.add('hidden'));
    }

    renderScoreCard(icon, label, score, color) {
        const border = { red: 'border-red-200 bg-red-50', blue: 'border-blue-200 bg-blue-50', green: 'border-green-200 bg-green-50', purple: 'border-purple-200 bg-purple-50' }[color];
        const text = { red: 'text-red-600', blue: 'text-blue-600', green: 'text-green-600', purple: 'text-purple-600' }[color];
        return `<div class="score-card p-6 rounded-2xl border-2 ${border}"><div class="flex items-center gap-3 mb-4"><span class="text-3xl">${icon}</span><h3 class="text-xl font-bold text-gray-900">${label}</h3></div><div class="text-3xl font-bold ${text}">${Math.round(score)}%</div><div class="w-full bg-white rounded-full h-2 mt-3"><div class="h-2 rounded-full transition-all duration-1000 bg-gradient-to-r from-purple-400 to-purple-600" style="width: ${score}%"></div></div></div>`;
    }

    restart() {
        this.currentQuestion = 0;
        this.answers = {};
        document.getElementById('results-modal').classList.add('hidden');
        this.renderQuestion();
    }
}

window.Questionnaire = Questionnaire;
