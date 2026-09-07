#!/bin/sh
set -e

echo "=== GCC Startup Platform ==="
echo "Running database migrations..."

# Run Drizzle migrations
cd /app
npx drizzle-kit migrate --config=packages/db/drizzle.config.ts 2>/dev/null || echo "No migrations to run or database not ready"

echo "Starting application..."
exec node apps/web/server.js
