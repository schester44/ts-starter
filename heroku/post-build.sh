#!/bin/bash

set -e

echo "Post-build script starting..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "Testing database connection..."

# Try to connect to the database with retry
MAX_RETRIES=2
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if psql "$DATABASE_URL" -c "SELECT 1" >/dev/null 2>&1; then
    echo "Database connection successful"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "Failed to connect to database. Retrying in 10 seconds... (Attempt $RETRY_COUNT/$MAX_RETRIES)"
      sleep 10
    else
      echo "Error: Failed to connect to database after $MAX_RETRIES attempts"
      exit 1
    fi
  fi
done

# Check if organization table exists
TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization');")

if [ "$TABLE_EXISTS" = "t" ]; then
  echo "organization table exists. Database is already migrated."
else
  echo "organization table does not exist. Running migrations..."

  # Run migrations with retry logic
  MAX_MIGRATION_RETRIES=5
  MIGRATION_RETRY_COUNT=0

  while [ $MIGRATION_RETRY_COUNT -lt $MAX_MIGRATION_RETRIES ]; do
    if yarn workspace @__APP_NAME__/db migrate deploy; then
      echo "Migrations completed successfully"
      break
    else
      MIGRATION_RETRY_COUNT=$((MIGRATION_RETRY_COUNT + 1))
      if [ $MIGRATION_RETRY_COUNT -lt $MAX_MIGRATION_RETRIES ]; then
        echo "Migration failed. Retrying in 5 seconds... (Attempt $MIGRATION_RETRY_COUNT/$MAX_MIGRATION_RETRIES)"
        sleep 5
      else
        echo "Error: Failed to run migrations after $MAX_MIGRATION_RETRIES attempts"
        exit 1
      fi
    fi
  done
fi

exit 0
