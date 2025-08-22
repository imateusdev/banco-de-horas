#!/bin/sh

# Exit on any error
set -e

echo "🚀 Starting application..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (just in case)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the application
echo "🌟 Starting Next.js application..."
exec node server.js
