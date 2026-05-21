#!/usr/bin/env bash
set -euo pipefail

# ─── Check for gum ──────────────────────────────────────────────
if ! command -v gum &>/dev/null; then
  echo "This script requires gum. Install it:"
  echo "  brew install gum"
  exit 1
fi

# ─── Guard: don't run twice ─────────────────────────────────────
if ! grep -q "__APP_NAME__" package.json 2>/dev/null; then
  echo "This project has already been initialized."
  exit 0
fi

# ─── Prompt ─────────────────────────────────────────────────────
gum style --bold --foreground 212 "🚀 Project Setup"
echo ""

APP_NAME=$(gum input --placeholder "myapp" --prompt "App name (lowercase, no spaces): " --char-limit 30)

if [[ -z "$APP_NAME" ]]; then
  echo "No name provided. Aborting."
  exit 1
fi

# Validate: lowercase, no spaces, alphanumeric + hyphens
if [[ ! "$APP_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "Invalid name. Use lowercase letters, numbers, and hyphens only."
  exit 1
fi

# Title case: my-cool-app → My Cool App
APP_TITLE=$(echo "$APP_NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1')

echo ""
gum style --faint "  name:  $APP_NAME"
gum style --faint "  title: $APP_TITLE"
gum style --faint "  scope: @$APP_NAME/*"
gum style --faint "  db:    $APP_NAME"
echo ""

gum confirm "Look good?" || exit 0

# ─── Replace placeholders ──────────────────────────────────────
echo ""
gum spin --title "Replacing placeholders..." -- bash -c "
  find . -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.json' -o -name '*.md' -o -name '.env*' \\) \
    ! -path '*/node_modules/*' ! -path '*/.turbo/*' ! -path '*/generated/*' \
    ! -path '*/yarn.lock' ! -path '*/routeTree.gen*' ! -path '*/skills-lock*' \
    -exec sed -i '' \
      -e \"s/__APP_TITLE__/$APP_TITLE/g\" \
      -e \"s/__APP_NAME__/$APP_NAME/g\" \
      {} +
"

# ─── Regenerate route tree ──────────────────────────────────────
gum spin --title "Regenerating route tree..." -- bash -c "
  cd apps/app && npx @tanstack/router-cli generate 2>/dev/null
"

# ─── Install dependencies ──────────────────────────────────────
gum spin --title "Installing dependencies..." -- bash -c "
  yarn install 2>/dev/null
"

# ─── Generate Prisma client ────────────────────────────────────
gum spin --title "Generating Prisma client..." -- bash -c "
  cd packages/db && DATABASE_URL='postgresql://localhost:5432/$APP_NAME' npx prisma generate 2>/dev/null
"

# ─── Self-destruct ──────────────────────────────────────────────
# Remove setup script from the project — it's a one-time thing
rm -f setup.sh

echo ""
gum style --bold --foreground 82 "✓ Project initialized as \"$APP_NAME\""
echo ""
echo "Next steps:"
echo "  1. cp .env-example apps/web/.env  (edit with your values)"
echo "  2. createdb $APP_NAME"
echo "  3. cd packages/db && npx prisma migrate dev --name init"
echo "  4. yarn dev"
echo ""
