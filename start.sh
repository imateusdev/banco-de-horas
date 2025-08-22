#!/bin/sh

# Exit on any error
set -e

echo "🚀 Starting application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "🌟 Starting Next.js application..."
exec node server.js
