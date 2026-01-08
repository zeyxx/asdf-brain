# asdf-brain Deployment Guide

> "Don't trust, verify" - Complete deployment checklist

## Pre-Deployment Checklist

- [x] Server starts without errors
- [x] `/health` endpoint returns 200
- [x] `/api/health` returns ecosystem health (with auth)
- [x] `/api/ecosystem` returns node graph
- [x] `/api/patterns` returns pattern stats (with auth)
- [x] Dashboard serves HTML
- [x] Knowledge files populated (10 dimensions)
- [x] GitHub Actions workflow configured
- [x] render.yaml configured

## Environment Variables (Render)

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Already in render.yaml |
| `PORT` | `3001` | Already in render.yaml |
| `BRAIN_API_KEYS` | (see .private/api-keys.txt) | **Required for auth** |
| `RATE_LIMIT_MAX` | `100` | Optional, default 60 |
| `ALLOWED_ORIGINS` | `` | Optional, restrict CORS |

## Deployment Steps

### 1. Push Code to GitHub

```bash
# From local machine with proper GitHub permissions
cd /path/to/asdf-brain
git push origin main
```

### 2. Configure Render

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect GitHub repo: `zeyxx/asdf-brain`
4. Settings will auto-detect from `render.yaml`
5. Add environment variable:
   - Key: `BRAIN_API_KEYS`
   - Value: (copy from .private/api-keys.txt)
6. Click "Create Web Service"

### 3. Verify Deployment

```bash
# Health check (public)
curl https://asdf-brain.onrender.com/health

# Dashboard (public)
open https://asdf-brain.onrender.com/

# API with auth
curl -H "x-api-key: YOUR_API_KEY" \
  https://asdf-brain.onrender.com/api/health
```

### 4. Configure GitHub Actions

Add secrets to GitHub repo settings:
- `BRAIN_API_KEY` - For authenticated API calls in workflows

## Post-Deployment Verification

```bash
# Run all checks
curl -s https://asdf-brain.onrender.com/health | jq '.status'
# Expected: "ok"

curl -s https://asdf-brain.onrender.com/api/ecosystem | jq '.nodes | keys | length'
# Expected: 7

curl -s -H "x-api-key: $BRAIN_API_KEY" \
  https://asdf-brain.onrender.com/api/health | jq '.overall.score'
# Expected: 89
```

## Troubleshooting

### 403 Forbidden on API endpoints
- Check API key is correct
- Check `BRAIN_API_KEYS` env var in Render

### 503 Service Unavailable
- Check Render logs
- Knowledge files might be missing

### Rate Limited (429)
- Increase `RATE_LIMIT_MAX` if needed
- Check for runaway scripts

## Rollback

```bash
# Via Render dashboard:
# Deploys → Select previous deploy → "Rollback"

# Or via git:
git revert HEAD
git push origin main
```

---

*$asdfasdfa - This is fine.*
