FROM node:20-slim AS builder
RUN npm install -g bun

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Version identification — baked into the bundle at build time.
ARG APP_VERSION=dev
ARG GIT_SHA=unknown
ARG BUILT_AT=unknown
ENV VITE_APP_VERSION=$APP_VERSION \
    VITE_GIT_SHA=$GIT_SHA \
    VITE_BUILT_AT=$BUILT_AT

RUN bun run build

FROM nginx:alpine AS runner

ARG APP_VERSION=dev
ARG GIT_SHA=unknown
ARG BUILT_AT=unknown
LABEL org.opencontainers.image.title="pelvi-admin-web" \
      org.opencontainers.image.version=$APP_VERSION \
      org.opencontainers.image.revision=$GIT_SHA \
      org.opencontainers.image.created=$BUILT_AT \
      org.opencontainers.image.source="https://github.com/brav-lima/pelvi-admin"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
RUN sed -i 's/worker_processes  auto;/worker_processes 2;/' /etc/nginx/nginx.conf

EXPOSE 80

CMD ["/bin/sh", "-c", "NAMESERVER=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf) && case \"$NAMESERVER\" in *:*) export RESOLVER=\"[$NAMESERVER]\";; *) export RESOLVER=\"$NAMESERVER\";; esac && envsubst '$PORT $RESOLVER $BACKEND_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
