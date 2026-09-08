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
./node_modules/.bin/drizzle-kit migrate 2>&1 || echo "Migration failed (non-fatal, server will still start)"

echo "Starting Next.js Server on port 3005..."
exec node server.js
