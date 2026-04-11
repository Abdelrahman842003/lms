# Secrets Directory

## Security Policy

**CRITICAL**: This directory MUST NOT contain real secrets in Git.

### Files Required for Production (NOT in Git)

The following files are required at runtime but MUST be provisioned via:
- Docker Secrets (production)
- CI/CD vault
- Manual deployment (with proper access controls)

### Required Runtime Files

| File | Purpose | Source |
|------|---------|--------|
| `firebase_credentials.json` | Firebase Admin SDK | Firebase Console |
| `firebase_project_id.txt` | Firebase Project ID | Firebase Console |
| `cloudflare_r2_access_key_id.txt` | R2 Access Key ID | Cloudflare R2 Dashboard |
| `cloudflare_r2_secret_access_key.txt` | R2 Secret Key | Cloudflare R2 Dashboard |
| `cloudflare_r2_bucket.txt` | R2 Bucket Name | Cloudflare R2 Dashboard |
| `cloudflare_r2_endpoint.txt` | R2 Endpoint URL | Cloudflare R2 Dashboard |
| `cloudflare_r2_public_url.txt` | R2 Public URL | Cloudflare R2 Dashboard |
| `cloudflare_kv_account_id.txt` | KV Account ID | Cloudflare Dashboard |
| `cloudflare_kv_namespace_id.txt` | KV Namespace ID | Cloudflare Dashboard |
| `cloudflare_kv_api_token.txt` | KV API Token | Cloudflare Dashboard |
| `cloudflare_turnstile_secret_key.txt` | Turnstile Secret | Cloudflare Dashboard |

### Local Development Setup

1. Copy the example files:
   ```bash
   cp firebase_credentials.json.example firebase_credentials.json
   cp firebase_project_id.txt.example firebase_project_id.txt
   # ... etc for other files
   ```

2. Fill in real values from your respective service dashboards

3. The `.gitignore` ensures these files are never committed

### Production Deployment

Use Docker Secrets as configured in `docker-compose.prod.yml`:
```yaml
secrets:
  firebase_credentials:
    file: ./secrets/firebase_credentials.json  # Local file (not in git)
```

### Security Reminders

- NEVER commit real secrets to Git
- If secrets were committed, they must be rotated immediately
- Use `git filter-branch` or BFG Repo-Cleaner to remove from history
- The example files (`*.example`) are safe to commit
