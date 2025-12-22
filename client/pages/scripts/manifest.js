// Manifest 16Personalities-inspired Belief Circles

document.addEventListener('DOMContentLoaded', () => {
    // Render belief circles (1-7, 3 big, 2 medium, 2 small)
    const beliefCirclesDiv = document.getElementById('belief-circles');
    if (beliefCirclesDiv) {
        const sizes = ['small', 'medium', 'big', 'big', 'big', 'medium', 'small'];
        let selected = 4; // default to middle
        function renderCircles() {
            beliefCirclesDiv.innerHTML = '';
            for (let i = 1; i <= 7; i++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `belief-circle ${sizes[i-1]}${selected === i ? ' selected' : ''}`;
                btn.setAttribute('aria-label', `Belief ${i}`);
                btn.tabIndex = 0;
                btn.addEventListener('click', () => {
                    selected = i;
                    document.getElementById('belief-value')?.remove();
                    renderCircles();
                });
                btn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        selected = i;
                        document.getElementById('belief-value')?.remove();
                        renderCircles();
                    }
                });
                beliefCirclesDiv.appendChild(btn);
            }
            // Hidden input for form submission
            let hidden = document.getElementById('belief');
            if (!hidden) {
                hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.id = 'belief';
                hidden.name = 'belief';
                beliefCirclesDiv.parentNode.appendChild(hidden);
            }
            hidden.value = selected;
            // Show value
            const valSpan = document.createElement('span');
            valSpan.id = 'belief-value';
            valSpan.className = 'ml-2 text-indigo-600 font-bold';
            valSpan.textContent = selected;
            beliefCirclesDiv.appendChild(valSpan);
        }
        renderCircles();
    }

    // Handle form submission with learning preferences
    const manifestForm = document.getElementById('manifest-form');
    if (manifestForm) {
        manifestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Collect learning preferences
            const learningPreferences = [];
            const checkedBoxes = document.querySelectorAll('input[name="learningPreferences"]:checked');
            checkedBoxes.forEach(checkbox => {
                learningPreferences.push(checkbox.value);
            });
            
            // Add learning preferences to form data
            const formData = new FormData(e.target);
            
            // Convert to object for easier handling
            const manifestData = {
                vision: formData.get('vision'),
                why: formData.get('why'),
                intention: formData.get('intention'),
                belief: formData.get('belief'),
                timeline: formData.get('timeline'),
                support: formData.get('support'),
                learningPreferences: learningPreferences,
                gratitude: formData.get('gratitude')
            };
            
            // Store for later use by journey system
            localStorage.setItem('manifestData', JSON.stringify(manifestData));
            
            console.log('Manifest data collected with learning preferences:', manifestData);
            
            // Continue with existing form submission logic...
            // (This would integrate with the existing journey creation system)
        });
    }

    // Add visual feedback for learning preferences
    const learningCheckboxes = document.querySelectorAll('.learning-checkbox');
    learningCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const card = this.nextElementSibling;
            if (this.checked) {
                card.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 200);
            }
        });
    });
}); 