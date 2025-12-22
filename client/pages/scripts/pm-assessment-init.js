// pm-assessment-init.js
// Show stored PM assessment results if available

document.addEventListener('DOMContentLoaded', async () => {
    const hash = window.location.hash;
    if (hash !== '#results' && !localStorage.getItem('pmResults')) return;

    const stored = localStorage.getItem('pmResults');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            displayPmResults(data);
            return;
        } catch (e) {
            console.error('Failed to parse stored results', e);
        }
    }

    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const res = await fetch('/api/pm-assessment/results', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('pmResults', JSON.stringify(data));
            displayPmResults(data);
        }
    } catch (err) {
        console.error('Unable to load PM results', err);
    }
});

function displayPmResults(data) {
    const modal = document.getElementById('results-modal');
    if (!modal) return;
    const grid = document.getElementById('scores-grid');
    const s = data.scores || {};
    grid.innerHTML = [
        renderCard('🛠️','Product Skills', s.productSkills),
        renderCard('🤝','Leadership', s.leadership),
        renderCard('💼','Business Acumen', s.businessAcumen),
        renderCard('🎓','Career Foundation', s.careerFoundation),
        renderCard('🏛️','Executive Presence', s.executivePresence)
    ].join('');
    document.getElementById('overall-score').textContent = `${Math.round(s.overall || 0)}%`;
    document.getElementById('overall-message').textContent = data.readiness?.description || '';
    modal.classList.remove('hidden');
    document.getElementById('retake-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

function renderCard(icon, label, score) {
    return `
        <div class="score-card p-6 rounded-2xl border-2">
            <div class="flex items-center gap-3 mb-2">
                <span class="text-2xl">${icon}</span>
                <h3 class="text-xl font-bold text-gray-900">${label}</h3>
            </div>
            <p class="text-3xl font-bold text-gray-800">${Math.round(score || 0)}%</p>
        </div>`;
}
