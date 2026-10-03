# syntax=docker/dockerfile:1
# Multi-arch (linux/amd64, linux/arm64). Native modules (better-sqlite3, sharp) are built for the target platform.
FROM node:24-bookworm-slim AS build
ENV NEXT_TELEMETRY_DISABLED=1 CI=1
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/* && corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm build && rm -rf .next/cache && pnpm prune --prod

# The indexer runs under tsx as a child process of the server, so the runtime keeps node_modules
# (not Next's standalone trace) and the TypeScript sources it executes.
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 TAKEOUT_DIR=/takeout DATA_DIR=/data
RUN corepack enable && mkdir /data /takeout && chown node:node /data
WORKDIR /app
COPY --from=build --chown=node:node /app ./
USER node
VOLUME /data
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
