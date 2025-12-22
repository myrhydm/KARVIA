import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { useGoalsApi } from '../hooks/useGoalsApi';

interface CompletionData {
  completion_percentage: number;
  completed_goals: number;
  total_goals: number;
  last_updated: string;
}

export const CompletionPercentageWidget: React.FC = () => {
  const [data, setData] = useState<CompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchCompletionPercentage } = useGoalsApi();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetchCompletionPercentage();
        setData(result);
        setError(null);
      } catch (err) {
        setError('Failed to load completion data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCompletionPercentage]);

  const getColorByPercentage = (percentage: number): string => {
    if (percentage >= 80) return 'success';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Card className="completion-widget" aria-label="Loading completion data">
        <div className="skeleton-loader">
          <div className="skeleton-bar" />
          <div className="skeleton-text" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="completion-widget" aria-label="Error loading completion data">
        <div className="error-state">
          <span>Unable to load progress</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="completion-widget" 
      onClick={() => window.location.href = '/goals'}
      role="button"
      tabIndex={0}
      aria-label={`Goal completion: ${data.completion_percentage}%. Click to view details.`}
    >
      <div className="widget-header">
        <h3>Goal Progress</h3>
        <span className="percentage">{data.completion_percentage.toFixed(1)}%</span>
      </div>
      
      <ProgressBar
        value={data.completion_percentage}
        color={getColorByPercentage(data.completion_percentage)}
        size="lg"
        showLabel={false}
        aria-label={`Progress: ${data.completion_percentage}%`}
      />
      
      <div className="widget-footer">
        <span>{data.completed_goals} of {data.total_goals} goals complete</span>
      </div>
    </Card>
  );
};