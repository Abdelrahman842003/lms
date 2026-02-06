---
description: Execute the implementation planning workflow for Neetaq (نطاق) project using the plan template to generate design artifacts.
handoffs:
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for FEATURE_SPEC, IMPL_PLAN, SPECS_DIR, BRANCH. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Load context**: Read FEATURE_SPEC, `.specify/memory/constitution.md`, [`structure backend.md`](../structure%20backend.md), and [`structure frontend.md`](../structure%20frontend.md). Load IMPL_PLAN template (already copied).

3. **Execute plan workflow**: Follow the structure in IMPL_PLAN template to:
   - Fill Technical Context (mark unknowns as "NEEDS CLARIFICATION")
   - Fill Constitution Check section from Neetaq constitution
   - Evaluate gates (ERROR if violations unjustified)
   - Phase 0: Generate research.md (resolve all NEEDS CLARIFICATION)
   - Phase 1: Generate data-model.md, contracts/, quickstart.md
   - Phase 1: Update agent context by running the agent script
   - Re-evaluate Constitution Check post-design

4. **Stop and report**: Command ends after Phase 2 planning. Report branch, IMPL_PLAN path, and generated artifacts.

## Phases

### Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

### Phase 1: Design & Contracts

**Prerequisites:** `research.md` complete

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable
   - Follow Neetaq backend structure patterns

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Follow Neetaq API standards (ApiResponseTrait)
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Agent context update**:
   - Run `.specify/scripts/bash/update-agent-context.sh roo`
   - These scripts detect which AI agent is in use
   - Update the appropriate agent-specific context file
   - Add only new technology from current plan
   - Preserve manual additions between markers

**Output**: data-model.md, /contracts/*, quickstart.md, agent-specific file

## Neetaq-Specific Planning Guidelines

### Technical Context Template

When filling the Technical Context section in plan.md, use the following Neetaq-specific values:

**Backend (Laravel)**:
- **Language/Version**: PHP 8.2+
- **Primary Dependencies**: Laravel 12, Laravel Sanctum, Spatie Laravel Permission, Pest PHP
- **Storage**: MySQL/PostgreSQL, Redis (cache/queue), S3 (media)
- **Testing**: Pest PHP, PHPUnit
- **Target Platform**: Linux server (Docker)
- **Project Type**: web (backend + frontend)
- **Performance Goals**: API response < 200ms (p95), 1000+ req/s
- **Constraints**: <512MB memory per worker, <200ms p95
- **Scale/Scope**: 10k+ users, multi-tenant (academies)

**Frontend (Next.js)**:
- **Language/Version**: TypeScript 5.6+, Next.js 15.4, React 18.3
- **Primary Dependencies**: Axios, React Query, Lucide React, Tailwind CSS
- **Storage**: IndexedDB (offline), localStorage (preferences)
- **Testing**: Jest, React Testing Library, Playwright (E2E)
- **Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
- **Project Type**: web (SPA with SSR)
- **Performance Goals**: FCP < 1.5s, TTI < 3s, Lighthouse > 90
- **Constraints**: <500KB bundle (gzipped), <100MB memory
- **Scale/Scope**: 10k+ concurrent users, 50+ pages

### Constitution Check Gates

Based on Neetaq constitution, verify the following gates:

**Backend Gates**:
- [ ] Service-First Architecture pattern followed
- [ ] TDD approach planned (tests before code)
- [ ] Security considerations addressed (input validation, authorization)
- [ ] Type safety ensured (strict_types, return types)
- [ ] Code quality standards met (Laravel Pint, PHPStan)
- [ ] API-First design (RESTful, consistent responses)
- [ ] Performance considered (indexes, caching, lazy loading)
- [ ] Observability included (logging, error tracking)
- [ ] Internationalization (Arabic messages, RTL support)
- [ ] Documentation planned (docblocks, API docs)

**Frontend Gates**:
- [ ] Component architecture planned
- [ ] TDD approach planned (tests before code)
- [ ] Security considerations addressed (input validation, XSS prevention)
- [ ] Type safety ensured (TypeScript strict mode)
- [ ] Code quality standards met (ESLint, Prettier)
- [ ] Performance considered (code splitting, lazy loading)
- [ ] Accessibility included (WCAG 2.1 AA)
- [ ] Internationalization (Arabic messages, RTL support)
- [ ] Documentation planned (JSDoc, Storybook)

### Project Structure Template

When filling the Project Structure section in plan.md, use the following Neetaq-specific structure:

```text
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/{Module}/
│   │   ├── Requests/{Module}/
│   │   └── Resources/{Module}/
│   ├── DTOs/{Module}/
│   ├── Services/{Module}/
│   ├── Models/
│   ├── Observers/
│   └── Exceptions/
├── database/
│   ├── migrations/
│   ├── factories/
│   └── seeders/
└── tests/
    ├── Feature/
    └── Unit/

frontend/
├── src/
│   ├── app/
│   │   ├── {role}/
│   │   │   └── {feature}/
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   └── {role}/
│   ├── services/
│   │   ├── {module}/
│   ├── hooks/
│   ├── contexts/
│   ├── types/
│   └── utils/
└── tests/
    ├── unit/
    └── e2e/
```

### Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., additional service layer] | [current need] | [why direct access insufficient] |
| [e.g., custom state management] | [specific problem] | [why Context API insufficient] |

## Key rules

- Use absolute paths
- ERROR on gate failures or unresolved clarifications
- Follow Neetaq constitution for all design decisions
- Reference [`structure backend.md`](../structure%20backend.md) for backend patterns
- Reference [`structure frontend.md`](../structure%20frontend.md) for frontend patterns
- Ensure all user-facing messages are in Arabic
- Ensure RTL support for frontend components
