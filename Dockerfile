# Base stage for building the static files
FROM node:24-slim AS base
WORKDIR /app

# Corepack shims need root; pnpm itself is prepared as the non-root user
# (pinned to match compose.yaml / CI)
RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
USER node
RUN corepack prepare pnpm@11.3.0 --activate

COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .
RUN pnpm run build

# Runtime stage for serving the application
FROM nginx:mainline-alpine-slim AS runtime
COPY --from=base /app/dist /usr/share/nginx/html
EXPOSE 80
