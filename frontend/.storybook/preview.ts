import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Arabic/RTL support
    docs: {
      story: {
        inline: true,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1f2937',
        },
        {
          name: 'rtl-light',
          value: '#f9fafb',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        // Arabic-specific viewports
        arabicMobile: {
          name: 'Arabic Mobile',
          styles: {
            width: '375px',
            height: '667px',
            direction: 'rtl',
            fontFamily: 'Cairo, sans-serif',
          },
        },
      },
    },
  },
  // Global decorators
  decorators: [
    (Story) => (
      <div style={{ padding: '1rem', fontFamily: 'Cairo, sans-serif' }}>
        <Story />
      </div>
    ),
  ],
  // Globals for theme switching
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Text direction',
      defaultValue: 'rtl',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: [
          { value: 'rtl', title: 'RTL (Arabic)' },
          { value: 'ltr', title: 'LTR (English)' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;