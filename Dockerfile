# ----------------------------------------------------
# STAGE 1: COMPILACIÓN Y BUILD
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app
# Instalamos dependencias de sistema necesarias para el build
RUN apk add --no-cache openssl git

# Copiamos archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/  
COPY . .

# 1. Instalar TODAS las dependencias (incluyendo dev para generar el cliente)
RUN npm install

# 2. Ejecutar el build de Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 3. Limpieza SEGURA: Elimina dependencias de desarrollo sin romper nada
RUN npm prune --production  # <-- ESTO EVITA EL ERROR "prisma not found"

# ----------------------------------------------------
# STAGE 2: PRODUCCIÓN (La imagen final que corre tu app)
# ----------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# 4. INSTALACIÓN CRÍTICA: OpenSSL en producción
RUN apk add --no-cache openssl  # <-- ESTO ARREGLA EL "INTERNAL SERVER ERROR"

# 5. Copiar los archivos necesarios desde la etapa 'builder'
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma 
COPY --from=builder /app/node_modules ./node_modules

# Puerto y comando de inicio
EXPOSE 3000
CMD ["npm", "start"]