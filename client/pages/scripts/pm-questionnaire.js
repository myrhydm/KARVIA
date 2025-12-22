// Initialize the PM assessment using the shared Questionnaire class
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Please log in to access the PM Assessment');
        window.location.href = 'index.html';
        return;
    }

    try {
        const res = await fetch('questions/pm_assessment.json');
        const questions = await res.json();
        new Questionnaire({
            name: 'PM Assessment',
            questions,
            saveUrl: '/api/pm-assessment/submit',
            resultsUrl: '/api/pm-assessment/results',
            storageKey: 'pmSaved',
            resultsKey: 'pmResults',
            useFormData: false
        });
    } catch (err) {
        console.error('Failed to load questionnaire', err);
    }
});
