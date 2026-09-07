#!/bin/sh
echo "Running migrations..."
npx drizzle-kit migrate
echo "Starting application..."
exec node server.js
