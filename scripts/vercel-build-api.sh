#!/bin/sh
# Vercel build script for madecreative-api project
# 1. Generate Prisma client
prisma generate --schema=apps/api/prisma/schema.prisma

# 2. Build all @madecreative packages via Turbo
npx turbo run build --filter=@madecreative/api

# 3. Convert @madecreative workspace symlinks to real directories
# so Vercel's nft/includeFiles can copy them into the Lambda bundle
for pkg in db shared agents ai; do
  src="packages/$pkg"
  dest="node_modules/@madecreative/$pkg"
  if [ -L "$dest" ]; then
    rm "$dest"
    cp -rL "$src" "$dest"
  fi
done
