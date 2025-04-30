# FROM node:18-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# RUN npm run build      # например, "vite build"

# FROM nginx:stable-alpine
# COPY --from=builder /app/dist /usr/share/nginx/html
# # ваш кастомный конфиг nginx, если нужно, можно скопировать:
# # COPY nginx.conf /etc/nginx/nginx.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

# ──────────────────────────────────────────────────────────────
# 1) Сборка (builder)
# ──────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# Предполагается, что в package.json есть "build": "vite build"
RUN npm run build

# ──────────────────────────────────────────────────────────────
# 2) Продакшен на nginx
# ──────────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Удаляем дефолтную статику
RUN rm -rf /usr/share/nginx/html/*

# Копируем готовый билд
COPY --from=builder /app/dist /usr/share/nginx/html

# (опционально) можно положить свой конфиг nginx в /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]