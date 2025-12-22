// Initialize the vision questionnaire using the shared Questionnaire class
if (typeof console !== 'undefined') {
    console.log = function(){}; // suppress logs in production
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Please log in to access the Vision Questionnaire');
        window.location.href = 'index.html';
        return;
    }

    try {
        const res = await fetch('questions/vision.json');
        const questions = await res.json();
        new Questionnaire({
            name: 'Vision',
            questions,
            saveUrl: '/api/vision/save',
            analyzeUrl: '/api/vision/analyze',
            resultsUrl: '/api/vision/results',
            storageKey: 'visionSaved',
            resultsKey: 'visionResults',
            useFormData: true
        });
    } catch (err) {
        console.error('Failed to load questionnaire', err);
    }
});
