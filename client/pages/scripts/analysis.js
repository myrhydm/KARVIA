document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('summary-container')) return;
    await redirectIfNoToken();
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
    });
    loadSummary();
    loadAssessmentResults();
    const pmTab = document.getElementById('tab-pm');
    const visionTab = document.getElementById('tab-vision');
    const weeklyTab = document.getElementById('tab-weekly');
    if (pmTab) pmTab.addEventListener('click', () => switchTab('pm'));
    if (visionTab) visionTab.addEventListener('click', () => switchTab('vision'));
    if (weeklyTab) weeklyTab.addEventListener('click', () => switchTab('weekly'));
});

async function loadSummary() {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/analytics/weekly-summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            if (res.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = 'index.html';
            }
            throw new Error('Failed to load weekly summary');
        }
        const data = await res.json();
        renderSummary(data);
    } catch (err) {
        console.error(err);
        document.getElementById('summary-container').innerHTML = '<p class="text-red-500">Unable to load summary.</p>';
    }
}

function renderSummary(data) {
    const start = new Date(data.weekOf);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    document.getElementById('week-range').textContent = `${formatDate(start)} - ${formatDate(end)}`;
    const container = document.getElementById('summary-container');
    
    const goalSuccess = data.goalsPlanned > 0 ? Math.round((data.goalsAchieved / data.goalsPlanned) * 100) : 0;
    const taskSuccess = data.tasksPlanned > 0 ? Math.round((data.tasksCompleted / data.tasksPlanned) * 100) : 0;
    
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider">Goals</h4>
                    <span class="text-2xl">🎯</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 mb-2">${data.goalsAchieved}/${data.goalsPlanned}</div>
                <div class="flex items-center">
                    <div class="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div class="bg-green-500 h-2 rounded-full" style="width: ${goalSuccess}%"></div>
                    </div>
                    <span class="text-sm font-medium text-gray-600">${goalSuccess}%</span>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider">Tasks</h4>
                    <span class="text-2xl">✅</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 mb-2">${data.tasksCompleted}/${data.tasksPlanned}</div>
                <div class="flex items-center">
                    <div class="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                        <div class="bg-blue-500 h-2 rounded-full" style="width: ${taskSuccess}%"></div>
                    </div>
                    <span class="text-sm font-medium text-gray-600">${taskSuccess}%</span>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider">Focus Time</h4>
                    <span class="text-2xl">⏰</span>
                </div>
                <div class="text-3xl font-bold text-gray-900 mb-2">${formatHours(data.focusTimeSpent * 60)}</div>
                <div class="text-sm text-gray-500">Deep work sessions</div>
            </div>
        </div>`;
}

function formatHours(minutes) {
    const hrs = minutes / 60;
    return `${hrs % 1 === 0 ? hrs.toFixed(0) : hrs.toFixed(1)} hr`;
}

async function loadAssessmentResults() {
    const token = localStorage.getItem('authToken');
    try {
        const [pmRes, visionRes] = await Promise.all([
            fetch('/api/pm-assessment/results', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/vision/results', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const pmData = pmRes.ok ? await pmRes.json() : {};
        const visionData = visionRes.ok ? await visionRes.json() : {};
        renderAssessmentResults(pmData, visionData);
    } catch (err) {
        console.error('Failed to load results', err);
        const container = document.getElementById('assessment-container');
        if (container) container.innerHTML += '<p class="text-red-500">Unable to load assessment results.</p>';
    }
}

function renderAssessmentResults(pm, vision) {
    // Extract enhanced scoring dimensions
    let scores = vision.scores || {};
    
    // New 5-dimension scoring system
    const competency = scores.competency || 0;
    const network = scores.network || 0;
    const opportunities = scores.opportunities || 0;
    const mindset = scores.mindset || 0;
    const execution = scores.execution || 0;
    const overall = scores.overall || 0;
    
    // Legacy vision dimensions for vision tab
    const motivation = scores.motivation || 0;
    const readiness = scores.readiness || 0;
    const confidence = scores.confidence || 0;

    // Update overall score display
    const overallEl = document.getElementById('overall-score');
    if (overallEl) overallEl.textContent = `${Math.round(overall)}%`;
    
    // Render 5 core dimensions
    const grid = document.getElementById('dimension-grid');
    if (grid) {
        grid.innerHTML = [
            renderScoreCard('🎯', 'Clarity', network, 'blue'),
            renderScoreCard('🔥', 'Commitment', competency, 'red'),
            renderScoreCard('🌱', 'Adaptability', opportunities, 'green'),
            renderScoreCard('🧠', 'Competency', mindset, 'purple'),
            renderScoreCard('🚀', 'Opportunity', execution, 'indigo')
        ].join('');
    }

    // Render PM Assessment table
    const pmBody = document.getElementById('pm-table-body');
    if (pmBody) {
        pmBody.innerHTML = Object.entries(pm.scores || {}).map(([k, v]) => {
            const score = Math.round(v);
            const progressBar = `<div class="w-full bg-gray-200 rounded-full h-2"><div class="h-2 bg-indigo-600 rounded-full" style="width: ${score}%"></div></div>`;
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">${k.replace(/([A-Z])/g, ' $1').trim()}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">${score}%</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${progressBar}</td>
                </tr>`;
        }).join('');
    }

    // Render Vision Analysis - Enhanced soft skills dimensions
    const visionDimensionsGrid = document.getElementById('vision-dimensions-grid');
    if (visionDimensionsGrid) {
        // Calculate soft skills scores from vision data
        const confidenceScore = confidence || motivation || 50;
        const leadershipScore = Math.round((execution + network) / 2) || 50;
        const strategicThinking = Math.round((competency + opportunities) / 2) || 50;
        const resilienceScore = mindset || readiness || 50;
        
        visionDimensionsGrid.innerHTML = [
            renderVisionScoreCard('💪', 'Confidence', confidenceScore, 'purple'),
            renderVisionScoreCard('👑', 'Leadership', leadershipScore, 'blue'),
            renderVisionScoreCard('🎯', 'Strategic Thinking', strategicThinking, 'green'),
            renderVisionScoreCard('🛡️', 'Resilience', resilienceScore, 'red')
        ].join('');
    }

    // Render Vision insights
    const analysis = vision.analysis || vision.feedback || {};
    const strengthsList = document.getElementById('vision-strengths-list');
    const growthList = document.getElementById('vision-growth-list');
    const actionsList = document.getElementById('vision-actions-list');
    
    if (strengthsList) {
        const strengths = analysis.strengths || (analysis.keyStrengths || []).map(s => 
            typeof s === 'string' ? s : s.description || s.strength || 'Strength identified'
        );
        strengthsList.innerHTML = strengths.length > 0 
            ? strengths.map(s => `<li class="flex items-start gap-2"><span class="text-green-600">✓</span><span class="text-green-700">${s}</span></li>`).join('')
            : '<li class="text-gray-500">Complete vision analysis to see strengths</li>';
    }
    
    if (growthList) {
        const growthAreas = analysis.growthAreas || (analysis.improvementAreas || []).map(a => 
            typeof a === 'string' ? a : a.description || a.area || 'Growth area identified'
        );
        growthList.innerHTML = growthAreas.length > 0
            ? growthAreas.map(a => `<li class="flex items-start gap-2"><span class="text-blue-600">→</span><span class="text-blue-700">${a}</span></li>`).join('')
            : '<li class="text-gray-500">Complete vision analysis to see growth areas</li>';
    }
    
    if (actionsList) {
        const nextSteps = analysis.nextSteps || analysis.recommendations || [];
        const actions = nextSteps.map(step => 
            typeof step === 'string' ? step : step.step || step.action || step.description || 'Action recommended'
        );
        actionsList.innerHTML = actions.length > 0
            ? actions.map((action, i) => `
                <li class="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-200">
                    <span class="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">${i + 1}</span>
                    <span class="text-purple-700">${action}</span>
                </li>`).join('')
            : '<li class="text-gray-500">Complete vision analysis to see recommended actions</li>';
    }
}


function renderScoreCard(icon, label, score, color) {
    const colorMap = {
        red: { border: 'border-red-200 bg-red-50', text: 'text-red-600', gradient: 'from-red-400 to-red-600' },
        blue: { border: 'border-blue-200 bg-blue-50', text: 'text-blue-600', gradient: 'from-blue-400 to-blue-600' },
        green: { border: 'border-green-200 bg-green-50', text: 'text-green-600', gradient: 'from-green-400 to-green-600' },
        purple: { border: 'border-purple-200 bg-purple-50', text: 'text-purple-600', gradient: 'from-purple-400 to-purple-600' },
        indigo: { border: 'border-indigo-200 bg-indigo-50', text: 'text-indigo-600', gradient: 'from-indigo-400 to-indigo-600' }
    };
    
    const colors = colorMap[color] || colorMap.blue;
    const roundedScore = Math.round(score);
    
    return `
        <div class="transform hover:scale-105 transition-all duration-300 p-6 rounded-2xl border-2 ${colors.border} shadow-lg hover:shadow-xl">
            <div class="text-center">
                <div class="text-4xl mb-3">${icon}</div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">${label}</h3>
                <div class="text-3xl font-bold ${colors.text} mb-3">${roundedScore}%</div>
                <div class="w-full bg-white rounded-full h-3 shadow-inner">
                    <div class="h-3 rounded-full transition-all duration-1000 bg-gradient-to-r ${colors.gradient}" style="width: ${score}%"></div>
                </div>
                <div class="mt-2 text-sm text-gray-500">
                    ${roundedScore >= 80 ? 'Excellent' : roundedScore >= 60 ? 'Good' : roundedScore >= 40 ? 'Fair' : 'Needs Work'}
                </div>
            </div>
        </div>`;
}

function renderVisionScoreCard(icon, label, score, color) {
    const colorMap = {
        red: { border: 'border-red-200 bg-red-50', text: 'text-red-600', gradient: 'from-red-400 to-red-600' },
        blue: { border: 'border-blue-200 bg-blue-50', text: 'text-blue-600', gradient: 'from-blue-400 to-blue-600' },
        green: { border: 'border-green-200 bg-green-50', text: 'text-green-600', gradient: 'from-green-400 to-green-600' },
        purple: { border: 'border-purple-200 bg-purple-50', text: 'text-purple-600', gradient: 'from-purple-400 to-purple-600' }
    };
    
    const colors = colorMap[color] || colorMap.blue;
    const roundedScore = Math.round(score);
    
    return `
        <div class="transform hover:scale-105 transition-all duration-300 p-4 rounded-xl border-2 ${colors.border} shadow-md hover:shadow-lg">
            <div class="text-center">
                <div class="text-3xl mb-2">${icon}</div>
                <h4 class="text-sm font-semibold text-gray-900 mb-2">${label}</h4>
                <div class="text-2xl font-bold ${colors.text} mb-2">${roundedScore}%</div>
                <div class="w-full bg-white rounded-full h-2 shadow-inner">
                    <div class="h-2 rounded-full transition-all duration-1000 bg-gradient-to-r ${colors.gradient}" style="width: ${score}%"></div>
                </div>
            </div>
        </div>`;
}

function switchTab(tab) {
    const pm = document.getElementById('pm-analysis');
    const vis = document.getElementById('vision-analysis');
    const weekly = document.getElementById('weekly-analysis');
    const pmTab = document.getElementById('tab-pm');
    const visionTab = document.getElementById('tab-vision');
    const weeklyTab = document.getElementById('tab-weekly');
    if (!pm || !vis || !weekly || !pmTab || !visionTab || !weeklyTab) return;

    const sections = { pm, vision: vis, weekly };
    const tabs = { pm: pmTab, vision: visionTab, weekly: weeklyTab };

    // Hide all sections
    Object.values(sections).forEach(el => el.classList.add('hidden'));
    
    // Reset all tabs to inactive state
    Object.values(tabs).forEach(btn => {
        btn.classList.remove('text-indigo-600', 'border-b-2', 'border-indigo-600', 'bg-indigo-50');
        btn.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50');
    });

    // Show active section and highlight active tab
    const activeSection = sections[tab];
    const activeTab = tabs[tab];
    if (activeSection) activeSection.classList.remove('hidden');
    if (activeTab) {
        activeTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:bg-gray-50');
        activeTab.classList.add('text-indigo-600', 'border-b-2', 'border-indigo-600', 'bg-indigo-50');
    }
}
