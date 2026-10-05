# ============================================================
# STAGE 1 — Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/api
RUN pnpm prisma generate
RUN pnpm build

# ============================================================
# STAGE 2 — Runner
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm@9 && apk add --no-cache dumb-init

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/uploads

WORKDIR /app/apps/api

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]