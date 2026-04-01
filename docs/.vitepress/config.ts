import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Neetaq Platform',
  description: 'Complete documentation for the Neetaq Educational Platform',
  
  base: '/',
  
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c82f6' }],
  ],

  themeConfig: {
    logo: '/logo.png',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started/quickstart' },
      { text: 'Docker', link: '/docker/overview' },
      { 
        text: 'Backend', 
        items: [
          { text: 'Architecture', link: '/backend/architecture' },
          { text: 'API Reference', link: '/backend/api/' },
          { text: 'Domains', link: '/backend/domains/' },
        ]
      },
      {
        text: 'Frontend',
        items: [
          { text: 'Architecture', link: '/frontend/architecture' },
          { text: 'Routing', link: '/frontend/routing' },
          { text: 'Authentication', link: '/frontend/authentication' },
          { text: 'Services', link: '/frontend/services-reference' },
          { text: 'Components', link: '/frontend/components-reference' },
        ]
      },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Quick Start', link: '/getting-started/quickstart' },
            { text: 'Environment Variables', link: '/getting-started/env-vars' },
            { text: 'Available Scripts', link: '/getting-started/scripts' },
          ],
        },
      ],
      
      '/docker/': [
        {
          text: 'Docker',
          items: [
            { text: 'Overview', link: '/docker/overview' },
            { text: 'Local Development', link: '/docker/local-dev' },
            { text: 'Deployment', link: '/docker/deployment' },
          ],
        },
      ],
      
      '/backend/': [
        {
          text: 'Backend Overview',
          items: [
            { text: 'Architecture', link: '/backend/architecture' },
            { text: 'Request Lifecycle', link: '/backend/request-lifecycle' },
            { text: 'Authentication', link: '/backend/auth' },
            { text: 'Security & Authorization', link: '/backend/security' },
            { text: 'Error Handling', link: '/backend/errors' },
            { text: 'Database', link: '/backend/database' },
          ],
        },
        {
          text: 'API Reference',
          collapsed: false,
          items: [
            { text: 'Complete API Reference', link: '/backend/api' },
            { text: 'Overview', link: '/backend/api/' },
            { text: 'Authentication', link: '/backend/api/authentication' },
            { text: 'Response Format', link: '/backend/api/response-format' },
            { text: 'Rate Limiting', link: '/backend/api/rate-limiting' },
            { text: 'Teacher API', link: '/backend/api/teacher' },
            { text: 'Student API', link: '/backend/api/student' },
            { text: 'Academy API', link: '/backend/api/academy' },
            { text: 'Guardian API', link: '/backend/api/guardian' },
            { text: 'Secretary API', link: '/backend/api/secretary' },
          ],
        },
        {
          text: 'Domains',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/backend/domains/' },
            { text: 'Application Domain', link: '/backend/domains/application' },
            { text: 'Auth Domain', link: '/backend/domains/auth' },
            { text: 'Enrollments Domain', link: '/backend/domains/enrollments' },
            { text: 'Exams Domain', link: '/backend/domains/exams' },
            { text: 'Gamification Domain', link: '/backend/domains/gamification' },
            { text: 'Lectures Domain', link: '/backend/domains/lectures' },
            { text: 'Media Domain', link: '/backend/domains/media' },
            { text: 'Notifications Domain', link: '/backend/domains/notifications' },
            { text: 'Reports Domain', link: '/backend/domains/reports' },
            { text: 'Reporting Domain', link: '/backend/domains/reporting' },
            { text: 'Subscriptions Domain', link: '/backend/domains/subscriptions' },
            { text: 'Videos Domain', link: '/backend/domains/videos' },
          ],
        },
        {
          text: 'Admin Panel',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/backend/filament/' },
            { text: 'Resources', link: '/backend/filament/resources' },
            { text: 'Settings', link: '/backend/filament/settings' },
            { text: 'Widgets', link: '/backend/filament/widgets' },
          ],
        },
        {
          text: 'Enums Reference',
          collapsed: true,
          items: [
            { text: 'Complete Reference', link: '/backend/enums' },
            { text: 'All Enums', link: '/backend/enums/' },
            { text: 'Auth Enums', link: '/backend/enums/auth' },
            { text: 'Enrollment Enums', link: '/backend/enums/enrollments' },
            { text: 'Exam Enums', link: '/backend/enums/exams' },
            { text: 'Subscription Enums', link: '/backend/enums/subscriptions' },
            { text: 'Video Enums', link: '/backend/enums/videos' },
            { text: 'Notification Enums', link: '/backend/enums/notifications' },
          ],
        },
        {
          text: 'Configuration',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/backend/configuration/' },
          ],
        },
        {
          text: 'Database',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/backend/database/' },
            { text: 'Migrations', link: '/backend/database/migrations' },
            { text: 'Seeders', link: '/backend/database/seeders' },
            { text: 'Factories', link: '/backend/database/factories' },
          ],
        },
        {
          text: 'Services',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/backend/services/' },
            { text: 'AuthService', link: '/backend/services/auth' },
            { text: 'DeviceLimitService', link: '/backend/services/device-limit' },
            { text: 'NotificationService', link: '/backend/services/notification' },
            { text: 'CacheService', link: '/backend/services/cache' },
          ],
        },
        {
          text: 'Traits',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/backend/traits/' },
            { text: 'ApiResponseTrait', link: '/backend/traits/api-response' },
            { text: 'HasDeviceTokens', link: '/backend/traits/has-device-tokens' },
            { text: 'HasAcademyFilter', link: '/backend/traits/has-academy-filter' },
            { text: 'ResolvesAcademy', link: '/backend/traits/resolves-academy' },
            { text: 'ResolvesTeacher', link: '/backend/traits/resolves-teacher' },
          ],
        },
        {
          text: 'Jobs & Events',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/backend/jobs-events/' },
          ],
        },
        {
          text: 'Policies',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/backend/policies/' },
            { text: 'StudentPolicy', link: '/backend/policies/student' },
            { text: 'ExamPolicy', link: '/backend/policies/exam' },
            { text: 'VideoPolicy', link: '/backend/policies/video' },
          ],
        },
      ],
      
      '/frontend/': [
        {
          text: 'Frontend Overview',
          items: [
            { text: 'Architecture', link: '/frontend/architecture' },
            { text: 'Routing', link: '/frontend/routing' },
            { text: 'API Client', link: '/frontend/api-client' },
          ],
        },
        {
          text: 'Core Infrastructure',
          collapsed: false,
          items: [
            { text: 'Authentication', link: '/frontend/authentication' },
            { text: 'State Management', link: '/frontend/state-management' },
            { text: 'Security', link: '/frontend/security' },
          ],
        },
        {
          text: 'Features',
          collapsed: false,
          items: [
            { text: 'Video System', link: '/frontend/video-system' },
            { text: 'Reports & Analytics', link: '/frontend/reports-analytics' },
            { text: 'Notifications & Real-time', link: '/frontend/notifications-realtime' },
            { text: 'Subscriptions & Billing', link: '/frontend/subscription-billing' },
            { text: 'Gamification & Attendance', link: '/frontend/gamification-attendance' },
          ],
        },
        {
          text: 'Reference',
          collapsed: true,
          items: [
            { text: 'Services Reference', link: '/frontend/services-reference' },
            { text: 'Components Reference', link: '/frontend/components-reference' },
            { text: 'i18n', link: '/frontend/i18n-internationalization' },
            { text: 'Performance & PWA', link: '/frontend/performance-pwa' },
            { text: 'Seasonal Theming', link: '/frontend/seasonal-theming' },
          ],
        },
      ],
      
      '/cookbook/': [
        {
          text: 'Cookbook',
          items: [
            { text: 'New Feature Guide', link: '/cookbook/new-feature' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/neetaq/platform' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present Neetaq Educational Platform',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },

  markdown: {
    lineNumbers: true,
  },

  // Build configuration
  srcExclude: ['**/README.md', '**/TODO.md'],
  
  // Ignore dead links during build
  ignoreDeadLinks: true,
})
