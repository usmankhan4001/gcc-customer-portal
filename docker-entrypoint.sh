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
# Use NODE_PATH so npx-installed drizzle-kit can find drizzle-orm in /app/node_modules
echo "Running database migrations..."
NODE_PATH=/app/node_modules npx drizzle-kit@0.31.10 migrate 2>&1 || echo "Migration failed (non-fatal, server will still start)"

echo "Starting Next.js Server on port 3005..."
exec node server.js
