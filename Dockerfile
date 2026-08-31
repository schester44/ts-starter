# __APP_NAME__ - Docker deployment (Railway-style single image, role selected via SERVICE_ROLE)
FROM node:22-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
      ca-certificates \
      openssl \
      postgresql-client \
      curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Enable corepack for yarn
RUN corepack enable

# Copy package files first (for better layer caching)
COPY package.json yarn.lock .yarnrc.yml ./

# Copy workspace package.json files
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/db/package.json packages/db/
COPY packages/observability/package.json packages/observability/
COPY packages/queues/package.json packages/queues/
COPY packages/storage/package.json packages/storage/
COPY packages/workflows/package.json packages/workflows/
COPY packages/testing/package.json packages/testing/
COPY packages/prisma-dbml-generator/package.json packages/prisma-dbml-generator/

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build the custom prisma-dbml-generator first (needed by prisma generate)
RUN yarn workspace @__APP_NAME__/prisma-dbml-generator build

# Generate Prisma client (dummy URL — generate only needs the schema, not a real connection)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" yarn workspace @__APP_NAME__/db generate

# Build all packages (no turbo cache to ensure consistent asset hashes)
RUN TURBO_FORCE=true yarn build

# Copy scripts and make executable
RUN chmod +x /app/deploy/release.sh

# SERVICE_ROLE is set per service: "web" or "worker"
ENV SERVICE_ROLE=web

CMD ["/bin/bash", "-c", "\
  if [ \"$SERVICE_ROLE\" = \"web\" ]; then \
    /app/deploy/release.sh && node apps/web/.output/server/index.mjs; \
  elif [ \"$SERVICE_ROLE\" = \"worker\" ]; then \
    node apps/worker/dist/index.js; \
  else \
    echo \"Unknown SERVICE_ROLE: $SERVICE_ROLE\" && exit 1; \
  fi"]
