# Tiendita Server Docker Image
# Multi-stage build for minimal image size

## Build
```bash
docker build -t tiendita-server .
```

## Run
```bash
docker run -p 3001:3001 \
  -e JWT_SECRET="your-secret-key" \
  -e MP_ACCESS_TOKEN="your-mp-token" \
  -e MP_PUBLIC_KEY="your-mp-public-key" \
  -e DATABASE_URL="postgres://..." \
  tiendita-server
```

## Docker Compose (recommended)
See `docker-compose.yml` in project root.

## Image Size
Target: ~150MB (Alpine + Node.js + deps)

## Security
- Non-root user (tiendita:nodejs)
- Minimal base image (Alpine)
- No dev dependencies in production
- HEALTHCHECK configured
