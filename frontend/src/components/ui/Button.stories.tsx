import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas
    layout: 'centered',
    docs: {
      description: {
        component: 'زر أساسي قابل للتخصيص يدعم أحجام وأنواع مختلفة'
      },
    },
  },
  // This component will have an automatically generated Autodocs entry
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost'],
      description: 'نوع الزر',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'حجم الزر',
    },
    disabled: {
      control: 'boolean',
      description: 'هل الزر معطل؟',
    },
    loading: {
      control: 'boolean',
      description: 'هل الزر في حالة تحميل؟',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'زر أساسي',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'زر ثانوي',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'زر كبير',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'زر صغير',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'زر معطل',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'جاري التحميل...',
  },
};

// RTL specific story
export const ArabicText: Story = {
  args: {
    children: 'حفظ التغييرات',
    variant: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'مثال على النص العربي مع التوجه من اليمين لليسار'
      },
    },
  },
};

// Interactive story for testing
export const Interactive: Story = {
  args: {
    children: 'اضغط هنا',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await step('يجب أن يكون الزر مرئياً', async () => {
      await expect(button).toBeInTheDocument();
    });

    await step('يجب أن يكون الزر قابلاً للنقر', async () => {
      await userEvent.click(button);
    });
  },
};