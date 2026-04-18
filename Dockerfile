# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

ARG NEXT_BASE_PATH=""
ENV NEXT_BASE_PATH=${NEXT_BASE_PATH}

COPY . .
RUN npm install && npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ARG NEXT_BASE_PATH=""
ENV NODE_ENV=production
ENV NEXT_BASE_PATH=${NEXT_BASE_PATH}

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
