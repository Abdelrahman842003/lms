# Git History Cleanup Guide - Secrets Removal

## Critical Security Incident Response

**Date**: 2026-03-11
**Severity**: P0 - Critical
**Issue**: Secrets were committed to the repository and must be removed from git history

## Actions Taken

1. **Cleaned `secrets/` folder** - Removed actual secret files and created `.example` templates
2. **Fixed `.gitignore`** - Updated to prevent future commits of secrets and `.env` files
3. **Updated documentation** - Added clear security policy in `secrets/README.md`

## Secrets That Were Exposed

The following files were found in the repository and have been removed:

| File | Risk | Action Required |
|------|------|-----------------|
| `firebase_credentials.json` | HIGH - Full Firebase admin access | **ROTATE IMMEDIATELY** |
| `neetaq-54091-firebase-adminsdk-*.json` | HIGH - Full Firebase admin access | **ROTATE IMMEDIATELY** |
| `cloudflare_turnstile_secret_key.txt` | MEDIUM - Turnstile bypass possible | Rotate recommended |
| Any `.env.production` with real values | CRITICAL - Database/Redis access | **ROTATE IMMEDIATELY** |

## Immediate Actions Required

### 1. Rotate All Exposed Secrets

**Firebase Admin SDK:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Project Settings > Service Accounts
3. Generate new private key
4. Update production deployment with new credentials
5. Delete old key from Firebase

**Cloudflare Turnstile:**
1. Go to Cloudflare Dashboard > Turnstile
2. Create new site secret key
3. Update `.env` and deployment configurations
4. Delete old secret key

**If `.env.production` was committed:**
1. Rotate all database passwords
2. Rotate Redis password
3. Rotate APP_KEY (run `php artisan key:generate`)
4. Update any API keys that were in the file

### 2. Clean Git History

Even though files have been deleted, they still exist in git history. Use one of these methods:

#### Method A: Using BFG Repo-Cleaner (Recommended - Faster)

```bash
# 1. Install BFG
# macOS: brew install bfg
# Linux: download from https://rtyley.github.io/bfg-repo-cleaner/

# 2. Create a full clone (important!)
cd /path/to/parent/directory
git clone --mirror git@github.com:username/repo.git repo-mirror.git

# 3. Run BFG to remove secrets folder
bfg --delete-folders secrets repo-mirror.git

# 4. Clean any remaining large files
bfg --strip-blobs-bigger-than 1M repo-mirror.git

# 5. Verify what will be removed
cd repo-mirror.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. Force push
git push --force
```

#### Method B: Using git filter-branch (Slower, but more control)

```bash
# 1. Backup your repository
git clone git@github.com:username/repo.git repo-backup

# 2. Run filter-branch to remove secrets folder
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch secrets/*.json secrets/*.txt" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Clean up refs
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push (BE CAREFUL!)
git push origin --force --all
git push origin --force --tags
```

### 3. Verify Cleanup

```bash
# Check if secrets still exist in history
git log --all --full-history -- secrets/
git log --all --full-history -- "*firebase*"
git log --all --full-history -- "*.env"

# Should return no results if cleanup was successful
```

## Prevention for Future

### `.gitignore` Rules

The following patterns are now in `.gitignore` to prevent future commits:

```gitignore
# Block all secrets
secrets/
secrets/*.txt
secrets/*.json
!secrets/*.example.json
!secrets/*.example.txt

# Block all .env files
.env
.env.*
!.env.example
!.env.development.example
!.env.production.example

# Block Firebase credentials
*firebase*.json
!firebase.example.json
!*.firebase.example.json
neetaq-*-firebase-*.json
```

### Pre-commit Hook (Recommended)

Add a pre-commit hook to prevent accidental secret commits:

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check for potential secrets
if git diff --cached --name-only | grep -E "\.(env|key|pem|json)$"; then
    echo "WARNING: You're about to commit files that may contain secrets!"
    echo "Please verify you're not committing sensitive data."
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

### Use Git-secrets or TruffleHog

**git-secrets:**
```bash
# Install
brew install git-secrets  # macOS
# or download from https://github.com/awslabs/git-secrets

# Configure
git secrets --install
git secrets --register-aws
git secrets --add 'password\s*=\s*".+"'
git secrets --add 'api_key\s*=\s*".+"'
```

**TruffleHog (for scanning existing history):**
```bash
docker run --rm -v "$PWD:/pwd" trufflesecurity/trufflehog:latest \
  git /pwd --only-verified
```

## Communication to Team

Send this message to all developers:

```
URGENT: Security Incident - Secret Rotation Required

We discovered that secrets were committed to the repository. All developers must:

1. Pull the latest changes with cleaned secrets
2. Obtain new secret files from secure location (contact DevOps)
3. Place them in local secrets/ folder
4. Verify local development works

DO NOT commit any secrets to git.
Contact security@company.com with questions.
```

## Recovery Contact

If you discover this incident too late and secrets have been exposed:

1. **Audit access logs** - Firebase, Cloudflare, database, Redis
2. **Notify stakeholders** - Anyone who might be affected
3. **Document the incident** - For post-mortem and compliance
4. **Implement monitoring** - To detect similar issues in future

## Checklist

- [ ] Secrets folder cleaned and replaced with examples
- [ ] `.gitignore` updated with proper exclusions
- [ ] Firebase admin key rotated
- [ ] Cloudflare Turnstile key rotated (if applicable)
- [ ] Any `.env` values rotated (if applicable)
- [ ] Git history cleaned with BFG or filter-branch
- [ ] Team notified about secret rotation
- [ ] Pre-commit hooks or git-secrets configured
- [ ] Access logs audited for unauthorized usage

## References

- [OWASP Git Secrets](https://cheatsheetseries.owasp.org/cheatsheets/Git_Security_Cheat_Sheet.html)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-secrets (AWS)](https://github.com/awslabs/git-secrets)
- [TruffleHog](https://trufflesecurity.com/trufflehog/)
