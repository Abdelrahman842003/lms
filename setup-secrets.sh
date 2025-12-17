#!/bin/bash

# Define the secrets directory
SECRETS_DIR="./secrets"
ENV_FILE=".env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found!"
    exit 1
fi

# Create secrets directory if it doesn't exist
if [ ! -d "$SECRETS_DIR" ]; then
    mkdir -p "$SECRETS_DIR"
    echo "Created directory: $SECRETS_DIR"
fi

# Function to read env var from .env file
get_env_var() {
    local key=$1
    grep "^$key=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'"
}

# Function to write secret to file
write_secret() {
    local key=$1
    local filename=$2
    local value=$(get_env_var "$key")

    if [ -z "$value" ]; then
        echo "Warning: $key not found in $ENV_FILE"
        return
    fi

    # Special handling for FIREBASE_CREDENTIALS if it's a file path
    if [ "$key" == "FIREBASE_CREDENTIALS" ]; then
        if [ -f "$value" ]; then
            cp "$value" "$SECRETS_DIR/$filename"
            echo "Copied $value to $SECRETS_DIR/$filename"
            return
        fi
    fi

    echo -n "$value" > "$SECRETS_DIR/$filename"
    echo "Generated $SECRETS_DIR/$filename"
}

echo "Generating Docker secrets from $ENV_FILE..."

# Map Env Vars to Secret Files
write_secret "FIREBASE_CREDENTIALS" "firebase_credentials.json"
write_secret "FIREBASE_PROJECT_ID" "firebase_project_id.txt"
write_secret "CLOUDFLARE_R2_ACCESS_KEY_ID" "cloudflare_r2_access_key_id.txt"
write_secret "CLOUDFLARE_R2_SECRET_ACCESS_KEY" "cloudflare_r2_secret_access_key.txt"
write_secret "CLOUDFLARE_R2_BUCKET" "cloudflare_r2_bucket.txt"
write_secret "CLOUDFLARE_R2_ENDPOINT" "cloudflare_r2_endpoint.txt"
write_secret "CLOUDFLARE_R2_PUBLIC_URL" "cloudflare_r2_public_url.txt"
write_secret "CLOUDFLARE_KV_ACCOUNT_ID" "cloudflare_kv_account_id.txt"
write_secret "CLOUDFLARE_KV_NAMESPACE_ID" "cloudflare_kv_namespace_id.txt"
write_secret "CLOUDFLARE_KV_API_TOKEN" "cloudflare_kv_api_token.txt"

echo "Done! Secrets are ready in $SECRETS_DIR"
