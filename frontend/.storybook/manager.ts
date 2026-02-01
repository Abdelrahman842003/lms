/**
 * Storybook Manager Configuration
 * Configuration for the Storybook UI
 */

import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

// Custom theme for LMS
const lmsTheme = create({
  base: 'light',
  brandTitle: 'LMS Components',
  brandUrl: './',
  brandImage: undefined,
  brandTarget: '_self',

  // Colors
  colorPrimary: '#3B82F6',
  colorSecondary: '#6366F1',

  // UI
  appBg: '#F9FAFB',
  appContentBg: '#FFFFFF',
  appBorderColor: '#E5E7EB',
  appBorderRadius: 8,

  // Toolbar default and active colors
  barTextColor: '#374151',
  barSelectedColor: '#3B82F6',
  barBg: '#FFFFFF',

  // Form colors
  inputBg: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputTextColor: '#374151',
  inputBorderRadius: 6,

  // Typography
  fontBase: '"Cairo", "Inter", sans-serif',
  fontCode: '"Fira Code", monospace',

  textColor: '#1F2937',
  textInverseColor: '#FFFFFF',
  textMutedColor: '#6B7280',
});

addons.setConfig({
  theme: lmsTheme,
  panelPosition: 'right',
  selectedPanel: 'controls',
  showNav: true,
  showPanel: true,
  showToolbar: true,
  isFullscreen: false,
  isToolshown: true,
  initialActive: 'sidebar',
  sidebar: {
    showRoots: true,
    collapsedRoots: ['ui'],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});