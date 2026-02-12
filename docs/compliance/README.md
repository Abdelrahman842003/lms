# README: Constitution Compliance Audit

**Purpose**: This folder contains detailed compliance audit reports against CLAUDE.md constitution.

---

## Reports

### 📊 [COMPLIANCE_SUMMARY.md](./COMPLIANCE_SUMMARY.md)
Overall compliance score, top violations, quick wins, and high-risk issues.

**Start here** for executive summary.

---

### 🔙 [BACKEND_COMPLIANCE.md](./BACKEND_COMPLIANCE.md)
Module-by-module audit of Laravel backend:
- Controllers (thin vs business logic)
- Services/Actions (Octane safety)
- Models (N+1 queries)
- Authorization (IDOR risks)
- DTOs and FormRequests

**Focus**: Architecture, Security, Performance

---

### 🎨 [FRONTEND_COMPLIANCE.md](./FRONTEND_COMPLIANCE.md)
Next.js App Router compliance:
- Server vs Client Components
- Type safety (TypeScript strict, Zod validation)
- URL-driven filters
- i18n and RTL
- Security (XSS, dangerouslySetInnerHTML)

**Focus**: Architecture, Type Safety, UX

---

### 🐳 [INFRA_COMPLIANCE.md](./INFRA_COMPLIANCE.md)
Docker, nginx, secrets management:
- Container security (non-root, healthchecks)
- Secrets handling (CRITICAL: never commit)
- nginx security headers
- Deployment and rollback strategy

**Focus**: Security, Operations, Reliability

---

## How to Use These Reports

### For Developers
1. Read your domain report (Backend/Frontend/Infra)
2. Search for your file/module name
3. Fix High severity issues first
4. Create tickets for Medium/Low

### For Tech Leads
1. Start with COMPLIANCE_SUMMARY.md
2. Review "High-Risk Issues" section
3. Prioritize based on security/impact
4. Assign tickets to team members

### For Project Managers
1. Read COMPLIANCE_SUMMARY.md only
2. Note estimated effort for each category
3. Plan sprints around High priority items
4. Track progress via resolved violations

---

## Audit Batches

**Batch 1**: backend/app/**  
**Batch 2**: backend/routes/** + database/** + config/**  
**Batch 3**: frontend/src/app/**  
**Batch 4**: frontend/src/components/** + services/** + hooks/**  
**Batch 5**: docker/nginx/**

If the initial audit doesn't cover all files, we can run additional batches.

---

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| 🔴 **Critical** | Security incident, data breach risk | IMMEDIATE (drop everything) |
| 🔴 **High** | Security vulnerability, architecture violation | This sprint |
| 🟡 **Medium** | Maintainability, performance issue | Next sprint |
| 🟢 **Low** | Code quality, minor inconsistency | Backlog |

---

## Running the Audit

To trigger a fresh audit, create a PR comment:

```
@claude

Run a CONSTITUTION COMPLIANCE AUDIT against CLAUDE.md.

Goal:
Verify file-by-file (backend/, frontend/, docker/nginx) whether the code complies with CLAUDE.md.
This is NOT a general review — it is a compliance check.

Output:
Create/Update these markdown files under docs/compliance/ (commit if possible, otherwise paste full content):

1) docs/compliance/COMPLIANCE_SUMMARY.md
- Overall score (%)
- Top 10 violations by severity
- Quick wins (fix in < 1 day)
- High-risk issues (security/octane/auth)

2) docs/compliance/BACKEND_COMPLIANCE.md
For each module/folder:
- ✅ compliant rules
- ❌ violations
Each violation must include:
- Rule reference (quote the exact CLAUDE.md section)
- File path + line range
- Why it violates
- Fix proposal (patch/snippet)
- Suggested test

3) docs/compliance/FRONTEND_COMPLIANCE.md
Same format as backend, focusing on:
- server vs client components
- typed fetch wrapper
- URL-driven filters
- i18n/no hardcoded strings
- security (no dangerous HTML)

4) docs/compliance/INFRA_COMPLIANCE.md
Docker/nginx/secrets:
- secrets handling violations
- non-root/multi-stage/healthchecks
- env templates policy

Rules:
- Be precise with file paths and line references.
- Severity: High/Med/Low.
- Do not give generic advice.
- If the repo is too large, do it in batches and state what was covered.
```

---

## Next Steps After Audit

1. **Triage** violations by severity
2. **Create tickets** for each High/Medium issue
3. **Assign owners** to fix them
4. **Set up CI checks** to prevent future violations:
   - Backend: Pint + PHPStan/Larastan
   - Frontend: ESLint + TypeScript strict
   - Security: gitleaks
5. **Schedule quarterly re-audits**

---

## Automation (Future)

To make compliance continuous:

### Backend CI
```yaml
# .github/workflows/backend-quality.yml
- name: Run Pint
  run: cd backend && composer pint
  
- name: Run PHPStan
  run: cd backend && composer phpstan
  
- name: Run Tests
  run: cd backend && composer test
```

### Frontend CI
```yaml
# .github/workflows/frontend-quality.yml
- name: Lint
  run: cd frontend && npm run lint
  
- name: Type Check
  run: cd frontend && npm run type-check
  
- name: Build
  run: cd frontend && npm run build
```

### Secrets Check
```yaml
# .github/workflows/security.yml
- name: Scan for secrets
  uses: gitleaks/gitleaks-action@v2
```

---

**Last Updated**: YYYY-MM-DD  
**Next Audit Due**: YYYY-MM-DD (quarterly)
