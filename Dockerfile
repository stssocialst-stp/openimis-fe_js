# Based on official openIMIS frontend Dockerfile
FROM node:16-bullseye AS build

RUN mkdir /app
COPY ./ /app
WORKDIR /app
RUN chown node /app -R
RUN npm install --global serve
RUN set -eux \
    && echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid-until \
    && sed -i 's|deb.debian.org/debian|archive.debian.org/debian|g' /etc/apt/sources.list || true \
    && apt-get update \
    && apt-get install -y --no-install-recommends nano openssl software-properties-common \
    && rm -rf /var/lib/apt/lists/*
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/privkey.pem \
    -out /etc/ssl/private/fullchain.pem \
    -subj "/C=ST/ST=SaoTome/L=SaoTome/O=STSSTP/OU=IT/CN=localhost"

USER node
ARG OPENIMIS_CONF_JSON
ENV GENERATE_SOURCEMAP=true
ENV OPENIMIS_CONF_JSON=${OPENIMIS_CONF_JSON}
ENV NODE_ENV=production

RUN npm run load-config || true
RUN npm install --legacy-peer-deps
# Install missing peer dependencies required by @openimis/fe-social_protection and material-table
# Use @material-table/core (maintained fork) instead of deprecated material-table
# Full MUI ecosystem to avoid missing dependency errors
RUN npm install \
    @material-table/core \
    @material-ui/core \
    @material-ui/icons \
    @material-ui/lab \
    @material-ui/pickers \
    @material-ui/styles \
    @mui/material \
    @mui/lab \
    @mui/icons-material \
    @mui/styles \
    @mui/system \
    @mui/utils \
    @mui/x-date-pickers \
    @emotion/react \
    @emotion/styled \
    @emotion/cache \
    --legacy-peer-deps || true

# Create alias for material-table to use @material-table/core
RUN cd node_modules && ln -sf @material-table/core material-table || true

RUN npm run build

### NGINX ###
FROM nginx:latest

# Copy built app
COPY --from=build /app/build/ /usr/share/nginx/html

# Copy default certs
COPY --from=build /etc/ssl/private/ /etc/nginx/ssl/live/host

# Copy nginx config
COPY ./conf /conf
COPY script/entrypoint.sh /script/entrypoint.sh

# Generate Diffie-Hellman Parameters (2048-bit)
RUN openssl dhparam -out /etc/nginx/dhparam.pem 2048
RUN chmod a+x /script/entrypoint.sh

WORKDIR /script

ENV DATA_UPLOAD_MAX_MEMORY_SIZE=12582912
ENV NEW_OPENIMIS_HOST="localhost"
ENV PUBLIC_URL="front"
ENV REACT_APP_API_URL="api"
ENV ROOT_MOBILEAPI="rest"
ENV FORCE_RELOAD=""
ENV OPENSEARCH_PROXY_ROOT="opensearch"

ENTRYPOINT ["/bin/bash", "/script/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
