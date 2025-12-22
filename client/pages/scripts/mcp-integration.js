/**
 * MCP Integration Client-Side JavaScript
 * Provides enhanced AI-powered features for the goal tracker
 */

class MCPIntegration {
  constructor() {
    this.baseUrl = '/api/mcp';
  }

  // Get user progress analysis
  async getUserAnalysis(userId, timeframe = 'week') {
    try {
      const response = await fetch(`${this.baseUrl}/analysis/${userId}?timeframe=${timeframe}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user analysis:', error);
      throw error;
    }
  }

  // Get user insights
  async getUserInsights(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/insights/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user insights:', error);
      throw error;
    }
  }

  // Get goal suggestions
  async getGoalSuggestions(userId, category = null) {
    try {
      const url = category 
        ? `${this.baseUrl}/suggestions/${userId}?category=${category}`
        : `${this.baseUrl}/suggestions/${userId}`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting goal suggestions:', error);
      throw error;
    }
  }

  // Get weekly progress summary
  async getWeeklySummary(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/summary/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting weekly summary:', error);
      throw error;
    }
  }

  // Get monthly analytics
  async getMonthlyAnalytics(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting monthly analytics:', error);
      throw error;
    }
  }

  // Get personalized recommendations
  async getRecommendations(userId, category = null) {
    try {
      const url = category 
        ? `${this.baseUrl}/recommendations/${userId}?category=${category}`
        : `${this.baseUrl}/recommendations/${userId}`;
        
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  // Display progress analysis in the UI
  async displayProgressAnalysis(containerId, userId, timeframe = 'week') {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
      }

      container.innerHTML = '<div class="loading">Loading progress analysis...</div>';

      const analysis = await this.getUserAnalysis(userId, timeframe);
      
      container.innerHTML = `
        <div class="mcp-analysis">
          <h3>Progress Analysis (${timeframe})</h3>
          <div class="analysis-grid">
            <div class="metric-card">
              <h4>Goals</h4>
              <p>Total: ${analysis.goals.total}</p>
              <p>Completed: ${analysis.goals.completed}</p>
              <p>Rate: ${analysis.goals.completionRate}</p>
            </div>
            <div class="metric-card">
              <h4>Tasks</h4>
              <p>Total: ${analysis.tasks.total}</p>
              <p>Completed: ${analysis.tasks.completed}</p>
              <p>Rate: ${analysis.tasks.completionRate}</p>
            </div>
            ${analysis.journey ? `
            <div class="metric-card">
              <h4>Journey</h4>
              <p>Stage: ${analysis.journey.stage}</p>
              <p>Week: ${analysis.journey.week}</p>
            </div>
            ` : ''}
          </div>
          ${analysis.insights.length > 0 ? `
          <div class="insights">
            <h4>Insights</h4>
            <ul>
              ${analysis.insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      `;
    } catch (error) {
      console.error('Error displaying progress analysis:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<div class="error">Failed to load progress analysis</div>';
      }
    }
  }

  // Display goal suggestions in the UI
  async displayGoalSuggestions(containerId, userId, category = null) {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
      }

      container.innerHTML = '<div class="loading">Loading goal suggestions...</div>';

      const suggestions = await this.getGoalSuggestions(userId, category);
      
      container.innerHTML = `
        <div class="mcp-suggestions">
          <h3>Goal Suggestions</h3>
          ${suggestions.suggestedGoals.length > 0 ? `
          <div class="suggestions-list">
            ${suggestions.suggestedGoals.map(goal => `
              <div class="suggestion-card">
                <h4>${goal.title}</h4>
                <p>${goal.description}</p>
                <div class="suggestion-meta">
                  <span class="category">${goal.category}</span>
                  <span class="difficulty">${goal.difficulty}</span>
                </div>
                <button onclick="addSuggestedGoal('${goal.title}', '${goal.description}', '${goal.category}')">
                  Add as Goal
                </button>
              </div>
            `).join('')}
          </div>
          ` : '<p>No suggestions available at this time.</p>'}
          <div class="suggestions-meta">
            <small>Based on ${suggestions.basedOn.recentGoals} recent goals and ${suggestions.basedOn.completedTasks} completed tasks</small>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error displaying goal suggestions:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<div class="error">Failed to load goal suggestions</div>';
      }
    }
  }

  // Display insights dashboard
  async displayInsightsDashboard(containerId, userId) {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
      }

      container.innerHTML = '<div class="loading">Loading insights dashboard...</div>';

      const insights = await this.getUserInsights(userId);
      
      container.innerHTML = `
        <div class="mcp-insights-dashboard">
          <h3>AI-Powered Insights</h3>
          
          <div class="insights-grid">
            <div class="insight-card">
              <h4>Journey Progress</h4>
              <p>Stage: ${insights.overallProgress.journeyStage}</p>
              <p>Week: ${insights.overallProgress.journeyWeek}</p>
            </div>
            
            <div class="insight-card">
              <h4>Activity Patterns</h4>
              <p>Most Productive: ${insights.patterns.mostProductiveDay}</p>
              <p>Avg Tasks/Week: ${insights.patterns.averageTasksPerWeek}</p>
              <p>Goal Trend: ${insights.patterns.goalCompletionTrend}</p>
            </div>
          </div>

          ${insights.recommendations.length > 0 ? `
          <div class="recommendations">
            <h4>Recommendations</h4>
            <ul>
              ${insights.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      `;
    } catch (error) {
      console.error('Error displaying insights dashboard:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<div class="error">Failed to load insights dashboard</div>';
      }
    }
  }

  // Initialize MCP features on page load
  init(userId) {
    // Add MCP-enhanced features to existing pages
    this.addMCPWidgets(userId);
  }

  // Add MCP widgets to existing pages
  addMCPWidgets(userId) {
    // Add to goals page
    const goalsContainer = document.querySelector('.goals-container');
    if (goalsContainer) {
      const mcpWidget = document.createElement('div');
      mcpWidget.innerHTML = `
        <div class="mcp-widget">
          <div id="mcp-goal-suggestions"></div>
          <button onclick="mcpIntegration.displayGoalSuggestions('mcp-goal-suggestions', '${userId}')">
            Get AI Goal Suggestions
          </button>
        </div>
      `;
      goalsContainer.appendChild(mcpWidget);
    }

    // Add to analytics page
    const analyticsContainer = document.querySelector('.analytics-container');
    if (analyticsContainer) {
      const mcpWidget = document.createElement('div');
      mcpWidget.innerHTML = `
        <div class="mcp-widget">
          <div id="mcp-progress-analysis"></div>
          <button onclick="mcpIntegration.displayProgressAnalysis('mcp-progress-analysis', '${userId}')">
            Get AI Progress Analysis
          </button>
        </div>
      `;
      analyticsContainer.appendChild(mcpWidget);
    }

    // Add to home page
    const homeContainer = document.querySelector('.home-container');
    if (homeContainer) {
      const mcpWidget = document.createElement('div');
      mcpWidget.innerHTML = `
        <div class="mcp-widget">
          <div id="mcp-insights-dashboard"></div>
          <button onclick="mcpIntegration.displayInsightsDashboard('mcp-insights-dashboard', '${userId}')">
            Show AI Insights
          </button>
        </div>
      `;
      homeContainer.appendChild(mcpWidget);
    }
  }
}

// Global instance
const mcpIntegration = new MCPIntegration();

// Helper function to add suggested goals
function addSuggestedGoal(title, description, category) {
  // This would integrate with your existing goal creation logic
  if (typeof createNewGoal === 'function') {
    createNewGoal({
      title,
      description,
      category,
      source: 'ai-suggestion'
    });
  } else {
    console.log('Add goal functionality not available');
    alert(`Goal suggestion: ${title}\n\n${description}\n\nCategory: ${category}`);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    mcpIntegration.init(userId);
  }
});