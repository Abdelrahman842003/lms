#!/bin/sh
# Wait for backend services to be available

echo "Waiting for octane service..."
until nc -z octane 8000; do
    echo "octane:8000 is unavailable - sleeping"
    sleep 2
done

echo "Waiting for frontend service..."
until nc -z frontend 3000; do
    echo "frontend:3000 is unavailable - sleeping"
    sleep 2
done

echo "Waiting for reverb service..."
until nc -z reverb 8080; do
    echo "reverb:8080 is unavailable - sleeping"
    sleep 2
done

echo "All services are up - starting nginx"
exec nginx -g 'daemon off;'
