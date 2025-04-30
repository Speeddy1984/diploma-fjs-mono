# # Этап сборки
# FROM node:20-slim AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# RUN npm run build

# # Этап продакшена
# FROM node:20-slim AS production
# WORKDIR /app
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/dist ./dist
# COPY package*.json ./
# EXPOSE 3000
# ENV NODE_ENV=production
# CMD ["node", "dist/main.js"]

# ──────────────────────────────────────────────────────────────
# 1) Сборка (builder) — устанавливаем dev-зависимости и компилируем
# ──────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Нам нужны python3, make и g++ для сборки bcrypt
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
# Предполагается, что в package.json есть скрипт "build" → nest build или tsc -b
RUN npm run build

# ──────────────────────────────────────────────────────────────
# 2) Продакшен-слой — ставим только runtime-deps и поднимаем
# ──────────────────────────────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# снова нужны билд-тулы, чтобы в этой среде собрать bcrypt нативно
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# ставим только prod-deps, здесь bcrypt соберётся для правильной glibc
RUN npm ci --omit=dev

# копируем транспайленый код из builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]