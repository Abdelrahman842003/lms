import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Neetaq Platform',
  description: 'Complete documentation for the Neetaq Educational Platform',
  
  base: '/',
  
  lastUpdated: false,

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
      { text: 'Backend', link: '/backend/architecture' },
      { text: 'Frontend', link: '/frontend/architecture' },
      { text: 'Architecture', link: '/ARCHITECTURE.md' },
      { text: 'API Conventions', link: '/API_CONVENTIONS.md' },
      { text: 'Caching', link: '/CACHING_STRATEGY.md' },
      { text: 'Performance', link: '/PERFORMANCE.md' },
      { text: 'Changelog', link: '/CHANGELOG.md' },
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
          text: 'Backend',
          items: [
            { text: 'Architecture', link: '/backend/architecture' },
            { text: 'Request Lifecycle', link: '/backend/request-lifecycle' },
            { text: 'Authentication', link: '/backend/auth' },
            { text: 'Error Handling', link: '/backend/errors' },
            { text: 'Database', link: '/backend/database' },
          ],
        },
      ],
      
      '/frontend/': [
        {
          text: 'Frontend',
          items: [
            { text: 'Architecture', link: '/frontend/architecture' },
            { text: 'API Client', link: '/frontend/api-client' },
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

    // editLink: {
    //   pattern: 'https://github.com/neetaq/platform/edit/main/docs/:path',
    //   text: 'Edit this page on GitHub',
    // },

    // lastUpdated disabled (requires git inside container)
    // lastUpdated: {
    //   text: 'Updated at',
    //   formatOptions: {
    //     dateStyle: 'full',
    //     timeStyle: 'medium',
    //   },
    // },
  },

  markdown: {
    // Mermaid diagrams rendered via client-side script in theme
  },

  // Build configuration
  srcExclude: ['**/README.md', '**/TODO.md'],
  
  // Ignore dead links during build (for external links)
  ignoreDeadLinks: [
    /^https?:\/\//,
  ],
})
