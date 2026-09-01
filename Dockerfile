# ─────────────────────────────────────────────────────────────────────
# Tueste · Origen Tostado — imagen de producción para Latinoamérica Hosting
# ─────────────────────────────────────────────────────────────────────
# Multi-stage con salida standalone de Next.js:
#   1. builder   → instala con `npm ci` y compila (typecheck/lint en CI)
#   2. runner    → imagen mínima, usuario no-root, `node server.js`
#
# Los secretos NUNCA se pasan como build args ni se hornean en la
# imagen: Latinoamérica Hosting los inyectará desde su configuración segura
# de variables (fase de despliegue).
# SITE_URL y las variables NEXT_PUBLIC_* son públicas y se admiten como
# argumentos de build. Next.js necesita estas últimas durante `npm run build`
# para insertarlas en el bundle del navegador.

# Versión LTS de Node fija desde .nvmrc.
ARG NODE_VERSION=24.20.0

# ── Etapa 1: build de producción ─────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Variables públicas de build (no secretos). SITE_URL define canonical
# y metadata; si no se entrega, el contrato usa el fallback demo local.
ARG SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SITE_URL=${SITE_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Etapa 2: imagen final mínima ─────────────────────────────────────
FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Usuario no-root (restringe la superficie ante cualquier compromiso).
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Solo el resultado standalone, los estáticos y los assets públicos.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Entrada del servidor standalone de Next.js.
CMD ["node", "server.js"]
