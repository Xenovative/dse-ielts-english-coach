FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    openssl ca-certificates curl python3 python3-venv python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY requirements-tts.txt ./
RUN python3 -m venv /app/.venv-tts \
  && /app/.venv-tts/bin/pip install --no-cache-dir -r requirements-tts.txt

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:./dev.db"

RUN npx prisma generate && npm run build \
  && mkdir -p /app/data /app/public/tts \
  && chown -R node:node /app

COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh \
  && chown -R node:node /app/.venv-tts

USER node
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
