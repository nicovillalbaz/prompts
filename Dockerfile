# 1. Usar la imagen oficial de Node 20 (¡Esto fuerza la versión!)
FROM node:20-alpine

# 2. Crear directorio de trabajo
WORKDIR /app

# 3. Instalar OpenSSL (Necesario para la base de datos Prisma)
RUN apk add --no-cache openssl

# 4. Copiar archivos de dependencias
COPY package*.json ./

# 5. Copiar la carpeta de base de datos (Vital para el postinstall)
COPY prisma ./prisma/

# 6. Instalar dependencias
# (Esto ejecutará automáticamente 'prisma generate' gracias a tu script postinstall)
RUN npm install

# 7. Copiar el resto del código fuente
COPY . .

# 8. Construir la aplicación Next.js
# Desactivamos telemetría para que sea más rápido
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 9. Configurar el comando de inicio
CMD ["npm", "start"]