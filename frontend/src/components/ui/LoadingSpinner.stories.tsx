/**
 * Loading Spinner Component Stories
 * Stories for the loading spinner component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';

const meta = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'مكون مؤشر التحميل المستخدم لإظهار حالة التحميل في التطبيق.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'حجم مؤشر التحميل',
    },
    color: {
      control: 'select',
      options: ['blue', 'white', 'gray'],
      description: 'لون مؤشر التحميل',
    },
  },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const WhiteColor: Story = {
  args: {
    color: 'white',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const InButton: Story = {
  render: () => (
    <Button variant="primary">
      <LoadingSpinner size="sm" color="white" />
      جاري التحميل...
    </Button>
  ),
};

export const FullScreenLoading: Story = {
  render: () => (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600">جاري تحميل البيانات...</p>
      </div>
    </div>
  ),
};
