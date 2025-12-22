import type { Meta, StoryObj } from '@storybook/react';
import { CompletionPercentageWidget } from './CompletionPercentageWidget';

const meta: Meta<typeof CompletionPercentageWidget> = {
  title: 'Dashboard/CompletionPercentageWidget',
  component: CompletionPercentageWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays user goal completion percentage with visual progress bar'
      }
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock the API hook for stories
const mockApiHook = {
  fetchCompletionPercentage: async () => ({
    completion_percentage: 75.5,
    completed_goals: 6,
    total_goals: 8,
    last_updated: '2025-01-01T10:00:00Z'
  })
};

export const HighCompletion: Story = {
  parameters: {
    mockData: {
      completion_percentage: 85.7,
      completed_goals: 6,
      total_goals: 7,
      last_updated: '2025-01-01T10:00:00Z'
    }
  }
};

export const MediumCompletion: Story = {
  parameters: {
    mockData: {
      completion_percentage: 55.0,
      completed_goals: 11,
      total_goals: 20,
      last_updated: '2025-01-01T10:00:00Z'
    }
  }
};

export const LowCompletion: Story = {
  parameters: {
    mockData: {
      completion_percentage: 25.0,
      completed_goals: 1,
      total_goals: 4,
      last_updated: '2025-01-01T10:00:00Z'
    }
  }
};

export const LoadingState: Story = {
  parameters: {
    mockData: null,
    loading: true
  }
};

export const ErrorState: Story = {
  parameters: {
    mockData: null,
    error: 'Failed to load completion data'
  }
};