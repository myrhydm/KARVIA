// combined-assessment.js
// Fetch PM and Vision results and render summary with tabs

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('overall-score')) return;
    await redirectIfNoToken();
    loadResults();
    document.getElementById('tab-pm').addEventListener('click', () => switchTab('pm'));
    document.getElementById('tab-vision').addEventListener('click', () => switchTab('vision'));
});

async function loadResults() {
    const token = localStorage.getItem('authToken');
    try {
        const [pmRes, visionRes] = await Promise.all([
            fetch('/api/pm-assessment/results', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/vision/results', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const pmData = pmRes.ok ? await pmRes.json() : {};
        const visionData = visionRes.ok ? await visionRes.json() : {};
        renderSummary(pmData, visionData);
    } catch (err) {
        console.error('Failed to load results', err);
    }
}

function renderSummary(pm, vision) {
    const scores = vision.scores?.dimensionScores || vision.scores || {};
    const overall = scores.overallScore || scores.overall || vision.assessment?.overallScore || 0;
    document.getElementById('overall-score').textContent = `${Math.round(overall)}%`;
    setDim('knowledge', scores.knowledge);
    setDim('skills', scores.skills);
    setDim('network', scores.network);
    setDim('foundation', scores.foundation);
    setDim('mindset', scores.mindset);

    const pmBody = document.getElementById('pm-table-body');
    pmBody.innerHTML = Object.entries(pm.scores || {}).map(([k,v]) =>
        `<tr><td class="border px-4 py-2 capitalize">${k}</td><td class="border px-4 py-2 text-right">${Math.round(v)}</td></tr>`
    ).join('');

    const visionBody = document.getElementById('vision-table-body');
    const analysis = vision.analysis || vision.feedback || {};
    if (analysis.keyStrengths || analysis.improvementAreas) {
        const items = (analysis.keyStrengths || []).map(s => `<li class="list-disc ml-5">${s}</li>`).join('');
        const growth = (analysis.improvementAreas || []).map(s => `<li class="list-disc ml-5">${s}</li>`).join('');
        visionBody.innerHTML = `<tr><td class="p-4 align-top">Strengths</td><td class="p-4">${items || '-'}</td></tr>` +
                               `<tr><td class="p-4 align-top">Growth Areas</td><td class="p-4">${growth || '-'}</td></tr>`;
    } else {
        visionBody.innerHTML = '<tr><td class="p-4">No analysis available.</td></tr>';
    }
}

function setDim(name, score) {
    const el = document.getElementById(`${name}-score`);
    if (el) el.textContent = `${Math.round(score || 0)}%`;
}

function switchTab(tab) {
    const pm = document.getElementById('pm-analysis');
    const vis = document.getElementById('vision-analysis');
    if (tab === 'pm') {
        pm.classList.remove('hidden');
        vis.classList.add('hidden');
    } else {
        vis.classList.remove('hidden');
        pm.classList.add('hidden');
    }
}
