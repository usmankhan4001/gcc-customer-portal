#!/bin/sh
set -e

# Export .env variables into environment if .env file exists
if [ -f /app/.env ]; then
  set -a
  . /app/.env
  set +a
elif [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# Run database migrations before starting the server
echo "Running database migrations..."
# npx installs drizzle-kit with its peer dep drizzle-orm in one go, avoiding
# module resolution issues between the standalone and copied node_modules
npx --yes drizzle-kit@0.31.10 migrate 2>&1 || echo "Migration failed (non-fatal, server will still start)"

echo "Starting Next.js Server on port 3005..."
exec node server.js
