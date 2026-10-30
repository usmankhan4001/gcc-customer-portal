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

# Run database migrations before starting the server. A failed migration means the code expects a
# schema the database does not have, so refuse to start (visible deploy failure) instead of serving errors.
# Escape hatch for a database bootstrapped without migration history: set ALLOW_MIGRATION_FAILURE=1 temporarily.
MIGRATE_CMD="${MIGRATE_CMD:-./node_modules/.bin/drizzle-kit migrate}"
START_CMD="${START_CMD:-node server.js}"
echo "Running database migrations..."
if ! sh -c "$MIGRATE_CMD"; then
  if [ "$ALLOW_MIGRATION_FAILURE" = "1" ]; then
    echo "WARNING: migration failed but ALLOW_MIGRATION_FAILURE=1, starting anyway" >&2
  else
    echo "FATAL: database migration failed, refusing to start" >&2
    exit 1
  fi
fi

echo "Starting Next.js Server on port 3005..."
exec $START_CMD
