/**
 * Dream Display Components
 * UI components for displaying parsed dream data
 */

class DreamDisplay {
    constructor() {
        this.currentDream = null;
    }

    /**
     * Display parsed dream data in a beautiful UI
     * @param {Object} dreamData - Parsed dream data
     * @param {HTMLElement} container - Container element
     */
    displayParsedDream(dreamData, container) {
        if (!dreamData || !container) return;

        this.currentDream = dreamData;

        // Clear container
        container.innerHTML = '';

        // Create main container
        const dreamCard = document.createElement('div');
        dreamCard.className = 'bg-white rounded-2xl shadow-lg p-6 border border-gray-100';

        // Header with dream type
        const header = this.createHeader(dreamData);
        dreamCard.appendChild(header);

        // Quality metrics
        const metrics = this.createQualityMetrics(dreamData);
        dreamCard.appendChild(metrics);

        // Key fields display
        const fields = this.createFieldsDisplay(dreamData);
        dreamCard.appendChild(fields);

        // Insights section
        if (dreamData.insights) {
            const insights = this.createInsightsSection(dreamData.insights);
            dreamCard.appendChild(insights);
        }

        // Actions
        const actions = this.createActionButtons(dreamData);
        dreamCard.appendChild(actions);

        container.appendChild(dreamCard);
    }

    /**
     * Create header with dream type and status
     */
    createHeader(dreamData) {
        const header = document.createElement('div');
        header.className = 'flex justify-between items-start mb-6';

        const leftSide = document.createElement('div');
        
        // Dream type badge
        const typeBadge = document.createElement('span');
        typeBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            dreamData.mode === 'employee' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
        }`;
        
        const icon = dreamData.mode === 'employee' ? '🧑‍💼' : '🚀';
        typeBadge.innerHTML = `${icon} ${dreamData.mode.charAt(0).toUpperCase() + dreamData.mode.slice(1)} Dream`;
        
        leftSide.appendChild(typeBadge);

        // Timeline
        if (dreamData.timeHorizon) {
            const timeline = document.createElement('div');
            timeline.className = 'text-sm text-gray-600 mt-2';
            timeline.textContent = `Target: ${this.formatTimeHorizon(dreamData.timeHorizon)}`;
            leftSide.appendChild(timeline);
        }

        header.appendChild(leftSide);

        // Right side - parsing info
        const rightSide = document.createElement('div');
        rightSide.className = 'text-right';
        
        if (dreamData.parsingConfidence) {
            const confidence = document.createElement('div');
            confidence.className = 'text-sm text-gray-500';
            confidence.textContent = `${Math.round(dreamData.parsingConfidence * 100)}% parsed`;
            rightSide.appendChild(confidence);
        }

        header.appendChild(rightSide);

        return header;
    }

    /**
     * Create quality metrics display
     */
    createQualityMetrics(dreamData) {
        const metrics = document.createElement('div');
        metrics.className = 'grid grid-cols-3 gap-4 mb-6';

        // Quality score
        const qualityScore = document.createElement('div');
        qualityScore.className = 'text-center p-3 bg-blue-50 rounded-lg';
        qualityScore.innerHTML = `
            <div class="text-2xl font-bold text-blue-600">${Math.round((dreamData.qualityScore || 0) * 100)}%</div>
            <div class="text-xs text-blue-600">Quality</div>
        `;
        metrics.appendChild(qualityScore);

        // Clarity
        const clarity = document.createElement('div');
        clarity.className = 'text-center p-3 bg-green-50 rounded-lg';
        const clarityScore = dreamData.insights?.clarity?.score || 0;
        clarity.innerHTML = `
            <div class="text-2xl font-bold text-green-600">${Math.round(clarityScore * 100)}%</div>
            <div class="text-xs text-green-600">Clarity</div>
        `;
        metrics.appendChild(clarity);

        // Confidence
        const confidence = document.createElement('div');
        confidence.className = 'text-center p-3 bg-purple-50 rounded-lg';
        confidence.innerHTML = `
            <div class="text-2xl font-bold text-purple-600">${dreamData.confidence || 0}%</div>
            <div class="text-xs text-purple-600">Your Confidence</div>
        `;
        metrics.appendChild(confidence);

        return metrics;
    }

    /**
     * Create fields display based on dream type
     */
    createFieldsDisplay(dreamData) {
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'space-y-3 mb-6';

        const title = document.createElement('h3');
        title.className = 'text-lg font-semibold text-gray-800 mb-4';
        title.textContent = 'Key Details';
        fieldsContainer.appendChild(title);

        let fields;
        if (dreamData.mode === 'employee') {
            fields = this.getEmployeeFields(dreamData);
        } else {
            fields = this.getEntrepreneurFields(dreamData);
        }

        fields.forEach(field => {
            if (field.value && field.value !== null && field.value !== '') {
                const fieldElement = this.createFieldElement(field);
                fieldsContainer.appendChild(fieldElement);
            }
        });

        return fieldsContainer;
    }

    /**
     * Get employee fields for display
     */
    getEmployeeFields(dreamData) {
        return [
            { key: 'role', label: '🧑‍💼 Target Role', value: dreamData.role },
            { key: 'targetCompany', label: '🏢 Target Company', value: dreamData.targetCompany },
            { key: 'teamContext', label: '👥 Team Context', value: dreamData.teamContext },
            { key: 'industryVertical', label: '🏭 Industry', value: dreamData.industryVertical },
            { key: 'techFocus', label: '⚙️ Tech Focus', value: dreamData.techFocus },
            { key: 'marketType', label: '🛍️ Market Type', value: dreamData.marketType },
            { key: 'seniorityLevel', label: '📈 Seniority', value: dreamData.seniorityLevel },
            { key: 'impactStatement', label: '🎯 Impact Goal', value: dreamData.impactStatement }
        ];
    }

    /**
     * Get entrepreneur fields for display
     */
    getEntrepreneurFields(dreamData) {
        return [
            { key: 'ventureIdea', label: '💡 Venture Idea', value: dreamData.ventureIdea },
            { key: 'industryVertical', label: '🏭 Industry', value: dreamData.industryVertical },
            { key: 'targetPersona', label: '👤 Target Customer', value: dreamData.targetPersona },
            { key: 'techFocus', label: '⚙️ Technology', value: dreamData.techFocus },
            { key: 'productFormat', label: '📱 Product Format', value: dreamData.productFormat },
            { key: 'businessModel', label: '💰 Business Model', value: dreamData.businessModel },
            { key: 'marketType', label: '🛍️ Market Type', value: dreamData.marketType },
            { key: 'impactStatement', label: '🎯 Problem to Solve', value: dreamData.impactStatement }
        ];
    }

    /**
     * Create individual field element
     */
    createFieldElement(field) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors';
        
        const label = document.createElement('span');
        label.className = 'text-sm font-medium text-gray-600 flex-shrink-0';
        label.textContent = field.label;
        
        const value = document.createElement('span');
        value.className = 'text-sm text-gray-800 text-right ml-4 max-w-xs';
        value.textContent = field.value;
        
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(value);
        
        return fieldDiv;
    }

    /**
     * Create insights section
     */
    createInsightsSection(insights) {
        const section = document.createElement('div');
        section.className = 'border-t border-gray-200 pt-6 mb-6';

        const title = document.createElement('h3');
        title.className = 'text-lg font-semibold text-gray-800 mb-4';
        title.textContent = '💡 Insights & Recommendations';
        section.appendChild(title);

        // Clarity feedback
        if (insights.clarity) {
            const clarityDiv = document.createElement('div');
            clarityDiv.className = 'mb-4';
            clarityDiv.innerHTML = `
                <div class="flex items-center mb-2">
                    <span class="text-sm font-medium text-gray-700">Clarity: </span>
                    <span class="ml-2 px-2 py-1 text-xs rounded-full ${this.getClarityColor(insights.clarity.level)}">
                        ${insights.clarity.level}
                    </span>
                </div>
                <p class="text-sm text-gray-600">${insights.clarity.feedback}</p>
            `;
            section.appendChild(clarityDiv);
        }

        // Recommendations
        if (insights.recommendations && insights.recommendations.length > 0) {
            const recTitle = document.createElement('h4');
            recTitle.className = 'text-sm font-medium text-gray-700 mb-2';
            recTitle.textContent = 'Recommendations:';
            section.appendChild(recTitle);

            const recList = document.createElement('div');
            recList.className = 'space-y-2';
            
            insights.recommendations.forEach(rec => {
                const recItem = document.createElement('div');
                recItem.className = 'text-sm text-gray-600 bg-blue-50 p-2 rounded flex items-start';
                recItem.innerHTML = `
                    <span class="text-blue-500 mr-2">•</span>
                    <span>${rec}</span>
                `;
                recList.appendChild(recItem);
            });
            
            section.appendChild(recList);
        }

        return section;
    }

    /**
     * Create action buttons
     */
    createActionButtons(dreamData) {
        const actions = document.createElement('div');
        actions.className = 'flex space-x-3';

        // Edit dream button
        const editBtn = document.createElement('button');
        editBtn.className = 'flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium';
        editBtn.textContent = '✏️ Edit Dream';
        editBtn.addEventListener('click', () => this.editDream());
        actions.appendChild(editBtn);

        // Generate goals button
        const goalsBtn = document.createElement('button');
        goalsBtn.className = 'flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium';
        goalsBtn.textContent = '🎯 Generate Goals';
        goalsBtn.addEventListener('click', () => this.generateGoals(dreamData));
        actions.appendChild(goalsBtn);

        // View JSON button
        const jsonBtn = document.createElement('button');
        jsonBtn.className = 'bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium';
        jsonBtn.textContent = '{ }';
        jsonBtn.title = 'View Raw Data';
        jsonBtn.addEventListener('click', () => this.showRawData(dreamData));
        actions.appendChild(jsonBtn);

        return actions;
    }

    /**
     * Get clarity color based on level
     */
    getClarityColor(level) {
        switch(level?.toLowerCase()) {
            case 'high': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    /**
     * Format time horizon for display
     */
    formatTimeHorizon(months) {
        if (months < 12) {
            return `${months} month${months !== 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            if (remainingMonths === 0) {
                return `${years} year${years !== 1 ? 's' : ''}`;
            } else {
                return `${years}y ${remainingMonths}m`;
            }
        }
    }

    /**
     * Handle edit dream action
     */
    editDream() {
        // Emit custom event for parent to handle
        const event = new CustomEvent('dreamEdit', {
            detail: { dream: this.currentDream }
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle generate goals action
     */
    async generateGoals(dreamData) {
        try {
            // Show loading state
            const event = new CustomEvent('goalsGenerationStart', {
                detail: { dream: dreamData }
            });
            document.dispatchEvent(event);

            // Make API call to generate goals
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/llm/generate-goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    dreamData: dreamData
                })
            });

            if (response.ok) {
                const result = await response.json();
                const event = new CustomEvent('goalsGenerated', {
                    detail: { goals: result.data, dream: dreamData }
                });
                document.dispatchEvent(event);
            } else {
                throw new Error('Failed to generate goals');
            }
        } catch (error) {
            console.error('Error generating goals:', error);
            const event = new CustomEvent('goalsGenerationError', {
                detail: { error: error.message }
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * Show raw dream data in modal
     */
    showRawData(dreamData) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-hidden';
        
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center p-4 border-b';
        header.innerHTML = `
            <h3 class="text-lg font-semibold">Raw Dream Data</h3>
            <button class="text-gray-500 hover:text-gray-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        const content = document.createElement('div');
        content.className = 'p-4 overflow-y-auto max-h-80';
        content.innerHTML = `
            <pre class="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">${JSON.stringify(dreamData, null, 2)}</pre>
        `;
        
        modalContent.appendChild(header);
        modalContent.appendChild(content);
        modal.appendChild(modalContent);
        
        // Close modal handlers
        const closeBtn = header.querySelector('button');
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        document.body.appendChild(modal);
    }

    /**
     * Create compact dream summary for cards
     */
    createCompactSummary(dreamData, container) {
        if (!dreamData || !container) return;

        container.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer';

        // Header
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-3';
        
        const typeBadge = document.createElement('span');
        typeBadge.className = `px-2 py-1 text-xs rounded-full font-medium ${
            dreamData.mode === 'employee' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-purple-100 text-purple-700'
        }`;
        typeBadge.textContent = dreamData.mode;
        
        const quality = document.createElement('span');
        quality.className = 'text-xs text-gray-500';
        quality.textContent = `${Math.round((dreamData.qualityScore || 0) * 100)}% quality`;
        
        header.appendChild(typeBadge);
        header.appendChild(quality);
        card.appendChild(header);

        // Key info
        const keyInfo = dreamData.mode === 'employee' 
            ? (dreamData.role || 'Career Goal') 
            : (dreamData.ventureIdea || 'Business Idea');
        
        const title = document.createElement('h4');
        title.className = 'font-medium text-gray-800 mb-2 line-clamp-2';
        title.textContent = keyInfo;
        card.appendChild(title);

        // Impact
        if (dreamData.impactStatement) {
            const impact = document.createElement('p');
            impact.className = 'text-sm text-gray-600 line-clamp-2';
            impact.textContent = dreamData.impactStatement;
            card.appendChild(impact);
        }

        // Click to expand
        card.addEventListener('click', () => {
            this.displayParsedDream(dreamData, container.parentElement);
        });

        container.appendChild(card);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DreamDisplay;
} else {
    window.DreamDisplay = DreamDisplay;
}