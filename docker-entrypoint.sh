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

echo "Running database migrations..."
npx drizzle-kit migrate

echo "Starting server..."
exec node server.js
