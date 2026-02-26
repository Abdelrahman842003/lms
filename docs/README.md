# Neetaq Platform Documentation

Documentation for the Neetaq Educational Platform built with VitePress.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

## Structure

```
docs/
├── .vitepress/
│   ├── config.ts          # VitePress configuration
│   └── theme/
│       ├── index.ts       # Theme entry
│       └── custom.css     # Custom styles
├── getting-started/
│   ├── quickstart.md      # Docker-first setup
│   ├── env-vars.md        # Environment variables
│   └── scripts.md         # Available commands
├── docker/
│   ├── overview.md        # Container architecture
│   ├── local-dev.md       # Development guide
│   └── deployment.md      # Production deployment
├── backend/
│   ├── architecture.md    # Domain structure
│   ├── request-lifecycle.md # Request flow
│   ├── auth.md            # Authentication
│   ├── errors.md          # Error handling
│   └── database.md        # ORM & models
├── frontend/
│   ├── architecture.md    # Next.js structure
│   └── api-client.md      # API client
├── cookbook/
│   └── new-feature.md     # Feature implementation
├── index.md               # Home page
└── package.json
```

## Writing Guidelines

1. Use VitePress frontmatter for titles and descriptions
2. Include Mermaid diagrams for architecture
3. Use tables for structured data
4. Cross-link related pages
5. List source file references at the bottom
6. Mark TODOs for missing information

## Features

- 📝 Markdown-based documentation
- 🎨 VitePress theme customization
- 📊 Mermaid diagram support
- 🔍 Full-text search
- 📱 Mobile-responsive design
- 🔗 Automatic link checking
