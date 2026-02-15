# syntax=docker/dockerfile:1.4

# Stage 1: Base
FROM oven/bun:1-alpine AS base
WORKDIR /usr/src/app

# Stage 2: Install - Instalar dependências com cache
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock* /temp/dev/
RUN --mount=type=cache,target=/root/.bun/install/cache \
    cd /temp/dev && bun install --frozen-lockfile

# Stage 3: Prerelease - Build da aplicação
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_PHASE=phase-production-build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_ESLINT=1
ENV BUN_CONFIG_MAX_HTTP_REQUESTS=1024

RUN --mount=type=cache,target=/usr/src/app/.next/cache \
    bun run build

# Stage 4: Release - Imagem final de produção
FROM oven/bun:1-alpine AS release
WORKDIR /app

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copiar arquivos do build
COPY --from=prerelease /usr/src/app/public ./public
COPY --from=prerelease --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=prerelease --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static

# Copiar dependências necessárias manualmente
COPY --from=install /temp/dev/node_modules/jose ./node_modules/jose

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["bun", "run", "server.js"]
