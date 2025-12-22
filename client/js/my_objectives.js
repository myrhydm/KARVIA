/**
 * My Objectives Page - Interactive Canvas with Drag & Drop
 * Full information visibility with beautiful animations
 */

class ObjectivesCanvas {
    constructor() {
        this.tiles = document.querySelectorAll('.tile.draggable');
        this.isDragging = false;
        this.draggedElement = null;
        this.originalPosition = null;
        
        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupInteractiveElements();
        this.animateOnLoad();
        this.setupFloatingActions();
        this.updateProgressBars();
    }

    setupDragAndDrop() {
        this.tiles.forEach(tile => {
            // Drag start
            tile.addEventListener('dragstart', (e) => {
                this.isDragging = true;
                this.draggedElement = e.target;
                this.originalPosition = {
                    gridArea: getComputedStyle(e.target).gridArea,
                    className: e.target.className
                };
                
                e.target.style.opacity = '0.7';
                e.target.style.transform = 'rotate(5deg) scale(0.95)';
                
                // Store data for drop
                e.dataTransfer.setData('text/plain', '');
                e.dataTransfer.effectAllowed = 'move';
            });

            // Drag end
            tile.addEventListener('dragend', (e) => {
                this.isDragging = false;
                e.target.style.opacity = '1';
                e.target.style.transform = '';
                this.draggedElement = null;
            });

            // Drag over (allow drop)
            tile.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (this.draggedElement !== e.target) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.3)';
                }
            });

            // Drag leave
            tile.addEventListener('dragleave', (e) => {
                if (this.draggedElement !== e.target) {
                    e.target.style.transform = '';
                    e.target.style.boxShadow = '';
                }
            });

            // Drop
            tile.addEventListener('drop', (e) => {
                e.preventDefault();
                
                if (this.draggedElement && this.draggedElement !== e.target) {
                    this.swapTiles(this.draggedElement, e.target);
                }
                
                // Reset styles
                e.target.style.transform = '';
                e.target.style.boxShadow = '';
            });
        });
    }

    swapTiles(tile1, tile2) {
        // Get current grid areas and classes
        const tile1Style = getComputedStyle(tile1);
        const tile2Style = getComputedStyle(tile2);
        
        const tile1GridArea = tile1Style.gridArea;
        const tile2GridArea = tile2Style.gridArea;
        
        // Swap grid areas by updating classes
        const tile1Classes = tile1.className.split(' ');
        const tile2Classes = tile2.className.split(' ');
        
        // Find and swap tile position classes
        const positionClasses = ['tile-center', 'tile-top-left', 'tile-top-right', 'tile-bottom-left', 'tile-bottom-right'];
        
        tile1Classes.forEach((cls, index) => {
            if (positionClasses.includes(cls)) {
                tile1Classes[index] = tile2Classes.find(c => positionClasses.includes(c));
            }
        });
        
        tile2Classes.forEach((cls, index) => {
            if (positionClasses.includes(cls)) {
                tile2Classes[index] = this.originalPosition.className.split(' ').find(c => positionClasses.includes(c));
            }
        });
        
        // Apply new classes with animation
        tile1.style.transition = 'all 0.5s ease';
        tile2.style.transition = 'all 0.5s ease';
        
        tile1.className = tile1Classes.join(' ');
        tile2.className = tile2Classes.join(' ');
        
        // Show swap feedback
        this.showSwapFeedback(tile1, tile2);
        
        // Reset transitions after animation
        setTimeout(() => {
            tile1.style.transition = '';
            tile2.style.transition = '';
        }, 500);
    }

    showSwapFeedback(tile1, tile2) {
        // Create a brief visual feedback for the swap
        const feedback = document.createElement('div');
        feedback.style.position = 'fixed';
        feedback.style.top = '2rem';
        feedback.style.right = '2rem';
        feedback.style.background = 'rgba(102, 126, 234, 0.9)';
        feedback.style.color = 'white';
        feedback.style.padding = '0.75rem 1.5rem';
        feedback.style.borderRadius = '12px';
        feedback.style.fontSize = '0.875rem';
        feedback.style.fontWeight = '600';
        feedback.style.zIndex = '9999';
        feedback.style.transform = 'translateX(100%)';
        feedback.style.transition = 'transform 0.3s ease';
        feedback.textContent = 'Objectives rearranged!';
        
        document.body.appendChild(feedback);
        
        // Animate in
        setTimeout(() => {
            feedback.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            feedback.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 3000);
    }

    setupInteractiveElements() {
        // Priority badge interactions
        document.querySelectorAll('.priority-badge').forEach(priority => {
            priority.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cyclePriority(e.target);
            });
        });

        // Progress bar click to edit
        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.addEventListener('click', (e) => {
                this.editProgress(e.target);
            });
        });

        // Collaborator avatars hover
        document.querySelectorAll('.collaborator-avatar').forEach(avatar => {
            avatar.addEventListener('mouseenter', (e) => {
                this.showCollaboratorTooltip(e.target);
            });
            
            avatar.addEventListener('mouseleave', (e) => {
                this.hideCollaboratorTooltip();
            });
        });

        // Quarterly expansion click handlers
        document.querySelectorAll('.quarter').forEach(quarter => {
            quarter.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showQuarterlyDetails(e.target);
            });
        });
    }

    cyclePriority(priorityElement) {
        const priorities = ['priority-low', 'priority-medium', 'priority-high'];
        const texts = ['Low Priority', 'Medium', 'High Priority'];
        
        let currentIndex = 0;
        priorities.forEach((cls, index) => {
            if (priorityElement.classList.contains(cls)) {
                currentIndex = index;
            }
        });
        
        // Remove current priority class
        priorityElement.className = priorityElement.className.replace(/priority-\w+/g, '');
        
        // Add next priority class
        const nextIndex = (currentIndex + 1) % priorities.length;
        priorityElement.classList.add(priorities[nextIndex]);
        priorityElement.textContent = texts[nextIndex];
        
        // Add animation
        priorityElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            priorityElement.style.transform = '';
        }, 200);
    }

    editProgress(progressBar) {
        const progressFill = progressBar.querySelector('.progress-fill');
        const percentageElement = progressBar.parentElement.querySelector('.progress-percentage');
        
        const currentWidth = parseInt(progressFill.style.width) || 0;
        
        // Create temporary input
        const input = document.createElement('input');
        input.type = 'range';
        input.min = '0';
        input.max = '100';
        input.value = currentWidth;
        input.style.position = 'absolute';
        input.style.top = '0';
        input.style.left = '0';
        input.style.width = '100%';
        input.style.height = '100%';
        input.style.opacity = '0';
        input.style.cursor = 'pointer';
        
        progressBar.style.position = 'relative';
        progressBar.appendChild(input);
        
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            progressFill.style.width = `${value}%`;
            percentageElement.textContent = `${value}%`;
        });
        
        input.addEventListener('blur', () => {
            progressBar.removeChild(input);
            progressBar.style.position = '';
        });
        
        input.focus();
    }

    showCollaboratorTooltip(avatar) {
        const names = ['John Smith', 'Mary Kim', 'Alex Rodriguez', 'Lisa Park', 'David Chen', 'Sarah Wilson'];
        const randomName = names[Math.floor(Math.random() * names.length)];
        
        const tooltip = document.createElement('div');
        tooltip.className = 'collaborator-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%) translateY(-8px)';
        tooltip.style.background = 'var(--gray-800)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '0.5rem 0.75rem';
        tooltip.style.borderRadius = '6px';
        tooltip.style.fontSize = '0.75rem';
        tooltip.style.fontWeight = '500';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.zIndex = '1000';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.2s ease';
        tooltip.textContent = randomName;
        
        // Add arrow
        const arrow = document.createElement('div');
        arrow.style.position = 'absolute';
        arrow.style.top = '100%';
        arrow.style.left = '50%';
        arrow.style.transform = 'translateX(-50%)';
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.borderLeft = '4px solid transparent';
        arrow.style.borderRight = '4px solid transparent';
        arrow.style.borderTop = '4px solid var(--gray-800)';
        tooltip.appendChild(arrow);
        
        avatar.style.position = 'relative';
        avatar.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
    }

    hideCollaboratorTooltip() {
        const tooltip = document.querySelector('.collaborator-tooltip');
        if (tooltip) {
            tooltip.parentElement.removeChild(tooltip);
        }
    }

    animateOnLoad() {
        // No initial delay - show everything immediately
        this.tiles.forEach((tile) => {
            tile.style.opacity = '1';
            tile.style.transform = 'translateY(0) scale(1)';
        });
        
        // Show page header immediately
        const header = document.querySelector('.page-header');
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
    }

    setupFloatingActions() {
        const floatingAdd = document.querySelector('.floating-action');
        
        floatingAdd.addEventListener('click', () => {
            this.showAddObjectiveModal();
        });
        
        // Floating action animations
        floatingAdd.addEventListener('mouseenter', () => {
            floatingAdd.style.transform = 'scale(1.15) rotate(90deg)';
        });
        
        floatingAdd.addEventListener('mouseleave', () => {
            floatingAdd.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    showQuarterlyDetails(quarterElement) {
        const quarter = quarterElement.dataset.quarter || quarterElement.closest('.quarter').dataset.quarter;
        
        // Sample weekly milestones data for each quarter
        const quarterlyData = {
            'Q1': {
                title: 'Q1 2024 - Foundation Building',
                description: 'Establishing core infrastructure and initial revenue streams',
                weeks: [
                    { week: 'Week 1-2', milestone: 'Sales Process Optimization', tasks: ['Implement new CRM workflow', 'Train sales team on process', 'Set up revenue tracking'] },
                    { week: 'Week 3-4', milestone: 'Customer Onboarding Enhancement', tasks: ['Redesign onboarding flow', 'Create customer success templates', 'Launch feedback system'] },
                    { week: 'Week 5-6', milestone: 'Product Foundation', tasks: ['Core feature development', 'Quality assurance testing', 'User acceptance testing'] },
                    { week: 'Week 7-8', milestone: 'Market Analysis', tasks: ['Competitive analysis update', 'Customer needs assessment', 'Pricing strategy review'] },
                    { week: 'Week 9-10', milestone: 'Team Structure', tasks: ['Hire key positions', 'Team training programs', 'Performance metrics setup'] },
                    { week: 'Week 11-12', milestone: 'Foundation Review', tasks: ['Q1 performance analysis', 'Process improvements', 'Q2 planning session'] }
                ],
                metrics: { target: '$2.1M ARR', actual: '$2.18M ARR', progress: '100%' }
            },
            'Q2': {
                title: 'Q2 2024 - Execution Phase',
                description: 'Scaling operations and expanding customer base',
                weeks: [
                    { week: 'Week 13-14', milestone: 'Sales Acceleration', tasks: ['Launch enterprise sales program', 'Implement lead scoring', 'Expand sales team'] },
                    { week: 'Week 15-16', milestone: 'Product Enhancement', tasks: ['Release feature set 2.0', 'API improvements', 'Mobile optimization'] },
                    { week: 'Week 17-18', milestone: 'Marketing Campaign', tasks: ['Launch brand awareness campaign', 'Content marketing strategy', 'SEO optimization'] },
                    { week: 'Week 19-20', milestone: 'Customer Success', tasks: ['Implement success metrics', 'Launch loyalty program', 'Expand support team'] },
                    { week: 'Week 21-22', milestone: 'Partnership Development', tasks: ['Strategic partner outreach', 'Integration partnerships', 'Channel partner program'] },
                    { week: 'Week 23-24', milestone: 'Scale Operations', tasks: ['Process automation', 'Team expansion', 'Infrastructure scaling'] }
                ],
                metrics: { target: '$2.4M ARR', actual: '$2.39M ARR', progress: '95%' }
            },
            'Q3': {
                title: 'Q3 2024 - Expansion Growth',
                description: 'Market expansion and feature diversification',
                weeks: [
                    { week: 'Week 25-26', milestone: 'Market Research', tasks: ['New market analysis', 'Customer segmentation', 'Competitive positioning'] },
                    { week: 'Week 27-28', milestone: 'Feature Pilots Launch', tasks: ['Beta feature testing', 'Customer feedback collection', 'Feature refinement'] },
                    { week: 'Week 29-30', milestone: 'Regional Expansion', tasks: ['Market entry strategy', 'Local partnerships', 'Regulatory compliance'] },
                    { week: 'Week 31-32', milestone: 'Customer Acquisition', tasks: ['Targeted marketing campaigns', 'Referral program launch', 'Sales process optimization'] },
                    { week: 'Week 33-34', milestone: 'Product Innovation', tasks: ['Advanced feature development', 'User experience improvements', 'Technical infrastructure'] },
                    { week: 'Week 35-36', milestone: 'Performance Optimization', tasks: ['Conversion rate optimization', 'Customer retention analysis', 'Process improvements'] }
                ],
                metrics: { target: '$2.8M ARR', actual: '$2.67M ARR', progress: '72%' }
            },
            'Q4': {
                title: 'Q4 2024 - Scale & Optimize',
                description: 'Achieving target growth and preparing for next year',
                weeks: [
                    { week: 'Week 37-38', milestone: 'Holiday Campaign Prep', tasks: ['Seasonal strategy development', 'Inventory planning', 'Campaign creative development'] },
                    { week: 'Week 39-40', milestone: 'Enterprise Focus', tasks: ['Enterprise sales push', 'Custom solution development', 'Key account management'] },
                    { week: 'Week 41-42', milestone: 'Feature Completion', tasks: ['Final feature releases', 'Quality assurance', 'Documentation completion'] },
                    { week: 'Week 43-44', milestone: 'Customer Success Drive', tasks: ['Retention campaign', 'Upselling initiatives', 'Success story collection'] },
                    { week: 'Week 45-46', milestone: 'Year-End Push', tasks: ['Sales acceleration', 'Contract renewals', 'Target achievement focus'] },
                    { week: 'Week 47-48', milestone: 'Planning & Review', tasks: ['Annual performance review', '2025 planning', 'Team goal setting'] }
                ],
                metrics: { target: '$3.2M ARR', actual: 'TBD', progress: '0%' }
            }
        };

        const data = quarterlyData[quarter] || quarterlyData['Q3'];
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.background = 'rgba(0, 0, 0, 0.5)';
        modal.style.backdropFilter = 'blur(5px)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '10000';
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.padding = '2rem';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.background = 'white';
        modalContent.style.borderRadius = '20px';
        modalContent.style.padding = '0';
        modalContent.style.maxWidth = '900px';
        modalContent.style.width = '100%';
        modalContent.style.maxHeight = '90vh';
        modalContent.style.overflowY = 'auto';
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.transition = 'transform 0.3s ease';

        // Build weekly milestones content
        const weeksHtml = data.weeks.map(week => `
            <div class="week-milestone">
                <div class="week-header">
                    <h4 class="week-title">${week.week}</h4>
                    <span class="milestone-badge">${week.milestone}</span>
                </div>
                <div class="week-tasks">
                    ${week.tasks.map(task => `<span class="task-item">• ${task}</span>`).join('')}
                </div>
            </div>
        `).join('');

        modalContent.innerHTML = `
            <div class="modal-header" style="padding: 2rem 2rem 1rem 2rem; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; justify-content: between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #1f2937;">${data.title}</h2>
                        <p style="color: #6b7280; margin-bottom: 1rem;">${data.description}</p>
                        <div style="display: flex; gap: 1rem; font-size: 0.875rem;">
                            <span style="color: #059669; font-weight: 600;">Target: ${data.metrics.target}</span>
                            <span style="color: #1f2937; font-weight: 600;">Actual: ${data.metrics.actual}</span>
                            <span style="color: #dc2626; font-weight: 600;">Progress: ${data.metrics.progress}</span>
                        </div>
                    </div>
                    <button class="modal-close" style="background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer; padding: 0; margin-left: 1rem;">&times;</button>
                </div>
            </div>
            <div class="modal-content" style="padding: 1.5rem 2rem 2rem 2rem;">
                <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: #1f2937;">Weekly Milestones & Tasks</h3>
                <div class="weekly-milestones">
                    ${weeksHtml}
                </div>
            </div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Add styles for weekly content
        const weeklyStyles = `
            <style>
            .week-milestone {
                margin-bottom: 1.5rem;
                padding: 1rem;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: #f9fafb;
            }
            .week-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;
            }
            .week-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: #374151;
                margin: 0;
            }
            .milestone-badge {
                font-size: 0.75rem;
                font-weight: 500;
                padding: 0.25rem 0.75rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 9999px;
            }
            .week-tasks {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            .task-item {
                font-size: 0.875rem;
                color: #6b7280;
                line-height: 1.4;
            }
            .modal-close:hover {
                color: #374151 !important;
            }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', weeklyStyles);

        // Animate in
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }, 10);

        // Close handlers
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.style.opacity = '0';
            modalContent.style.transform = 'scale(0.9)';
            setTimeout(() => modal.remove(), 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                modalContent.style.transform = 'scale(0.9)';
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    showAddObjectiveModal() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.background = 'rgba(0, 0, 0, 0.5)';
        modal.style.backdropFilter = 'blur(5px)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '10000';
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.background = 'white';
        modalContent.style.borderRadius = '20px';
        modalContent.style.padding = '2rem';
        modalContent.style.maxWidth = '500px';
        modalContent.style.width = '90%';
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.transition = 'transform 0.3s ease';
        modalContent.innerHTML = `
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--gray-900);">Add New Objective</h2>
            <form>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700);">Objective Title</label>
                    <input type="text" placeholder="Enter your objective..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--gray-700);">Priority</label>
                    <select style="width: 100%; padding: 0.75rem; border: 1px solid var(--gray-300); border-radius: 8px; font-size: 1rem;">
                        <option value="high">High Priority</option>
                        <option value="medium" selected>Medium Priority</option>
                        <option value="low">Low Priority</option>
                    </select>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <button type="button" onclick="this.closest('.modal-overlay').remove()" style="flex: 1; padding: 0.75rem; background: var(--gray-200); border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
                    <button type="submit" style="flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Create Objective</button>
                </div>
            </form>
        `;
        
        modal.className = 'modal-overlay';
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => {
            modal.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }, 10);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    updateProgressBars() {
        // Progress bars now show static progress without effects
        document.querySelectorAll('.progress-fill').forEach(fill => {
            // Remove any existing animations
            fill.style.animation = 'none';
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ObjectivesCanvas();
});

// Clean styling without shimmer effects
const additionalStyles = `
<style>
@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
    50% { box-shadow: 0 25px 50px rgba(102, 126, 234, 0.2); }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);