#!/bin/bash

# Script to help set up Cloudflare R2 credentials
# Run this script and follow the prompts

echo "==================================="
echo "Cloudflare R2 Setup Helper"
echo "==================================="
echo ""
echo "Please enter your Cloudflare R2 credentials:"
echo ""

read -p "Access Key ID: " ACCESS_KEY_ID
read -p "Secret Access Key: " SECRET_ACCESS_KEY
read -p "Bucket Name: " BUCKET_NAME
read -p "Endpoint URL (e.g., https://xxxxx.r2.cloudflarestorage.com): " ENDPOINT
read -p "Public URL (e.g., https://pub-xxxxx.r2.dev): " PUBLIC_URL

echo ""
echo "Writing credentials to files..."

echo -n "$ACCESS_KEY_ID" > secrets/cloudflare_r2_access_key_id.txt
echo -n "$SECRET_ACCESS_KEY" > secrets/cloudflare_r2_secret_access_key.txt
echo -n "$BUCKET_NAME" > secrets/cloudflare_r2_bucket.txt
echo -n "$ENDPOINT" > secrets/cloudflare_r2_endpoint.txt
echo -n "$PUBLIC_URL" > secrets/cloudflare_r2_public_url.txt

echo ""
echo "✅ Credentials saved!"
echo ""
echo "Now updating backend/.env file..."

# Update .env file
cd backend
sed -i "s|CLOUDFLARE_R2_ACCESS_KEY_ID=.*|CLOUDFLARE_R2_ACCESS_KEY_ID=$ACCESS_KEY_ID|" .env
sed -i "s|CLOUDFLARE_R2_SECRET_ACCESS_KEY=.*|CLOUDFLARE_R2_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY|" .env
sed -i "s|CLOUDFLARE_R2_BUCKET=.*|CLOUDFLARE_R2_BUCKET=$BUCKET_NAME|" .env
sed -i "s|CLOUDFLARE_R2_ENDPOINT=.*|CLOUDFLARE_R2_ENDPOINT=$ENDPOINT|" .env
sed -i "s|CLOUDFLARE_R2_PUBLIC_URL=.*|CLOUDFLARE_R2_PUBLIC_URL=$PUBLIC_URL|" .env

echo "✅ .env file updated!"
echo ""
echo "Now restarting Octane..."
cd ..
docker restart lms_octane

echo ""
echo "==================================="
echo "✅ Setup complete!"
echo "==================================="
echo ""
echo "You can now upload images to Cloudflare R2!"
