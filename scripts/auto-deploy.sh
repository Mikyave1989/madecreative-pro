#!/bin/bash
# Wait until after midnight UTC when Vercel deploy limit resets
# Then push an empty commit to trigger all Vercel deployments

cd C:/Users/miche/madecreative

git commit --allow-empty -m "chore: auto-deploy after Vercel daily limit reset

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git push origin main

echo "[$(date)] Deploy triggered successfully"
