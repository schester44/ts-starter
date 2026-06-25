#!/bin/bash
set -e

echo "Checking database for existing organizations..."
ORG_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM organization;")

if [ "$ORG_COUNT" = "0" ]; then
  echo "No organizations found. Running database seed..."
  yarn workspace @__APP_NAME__/db seed
  echo "Database seeding completed successfully"
else
  echo "Organization table has $ORG_COUNT row(s). Skipping seed."
fi

# Run schema migrations with retry logic
# Prisma's engine binary can have transient connection issues
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "Running schema migrations (attempt $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  if yarn workspace @__APP_NAME__/db migrate deploy; then
    echo "Schema migrations completed successfully"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "Migration failed. Retrying in 5 seconds..."
      sleep 5
    else
      echo "Error: Failed to run schema migrations after $MAX_RETRIES attempts"
      exit 1
    fi
  fi
done

# Run data migrations (environment-aware TypeScript migrations)
echo "Running data migrations..."
yarn workspace @__APP_NAME__/db data-migrate
echo "Data migrations completed successfully"
