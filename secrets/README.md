# Secrets Directory Policy

This directory must not contain real secrets in Git.

Required runtime files (provisioned out-of-band):
- `firebase_credentials.json`
- `firebase_project_id.txt`
- `cloudflare_r2_access_key_id.txt`
- `cloudflare_r2_secret_access_key.txt`
- `cloudflare_r2_bucket.txt`
- `cloudflare_r2_endpoint.txt`
- `cloudflare_r2_public_url.txt`
- `cloudflare_kv_account_id.txt`
- `cloudflare_kv_namespace_id.txt`
- `cloudflare_kv_api_token.txt`

Use your secret manager or CI/CD vault to inject these files at deploy time.
