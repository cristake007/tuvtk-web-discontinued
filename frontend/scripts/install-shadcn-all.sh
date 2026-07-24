#!/bin/sh
set -eu

if [ ! -f components.json ]; then
  echo "frontend/components.json is missing." >&2
  exit 1
fi

if [ ! -f package.json ]; then
  echo "Run this command from the frontend working directory." >&2
  exit 1
fi

echo "Installing the pinned Tailwind and shadcn toolchain..."
npm install --include=dev

echo "Adding the complete standard shadcn component registry..."
npm run shadcn:add-all

echo
npm run shadcn:info

echo
echo "shadcn component generation completed."
echo "Review frontend/src/components/ui, package.json, and package-lock.json before committing."
