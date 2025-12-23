FROM node:16-bullseye AS build-stage

RUN apt-get update && apt-get install -y nano openssl software-properties-common && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/privkey.pem \
    -out /etc/ssl/private/fullchain.pem \
    -subj "/C=DE/ST=_/L=_/O=_/OU=_/CN=localhost" && \
    npm install --global serve && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir /app && chown node:node /app
WORKDIR /app
USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node openimis.json modules-config.js openimis-config.js ./
COPY --chown=node:node script/ ./script/


ARG OPENIMIS_CONF_JSON
ENV GENERATE_SOURCEMAP=true
ENV OPENIMIS_CONF_JSON=${OPENIMIS_CONF_JSON}
ENV NODE_ENV=production


RUN npm run load-config

RUN npm install

COPY --chown=node:node src/ ./src/
COPY --chown=node:node public/ ./public/
COPY --chown=node:node config-overrides.js ./

RUN npm run build


### NGINX


FROM nginx:latest
COPY --from=build-stage /app/build/ /usr/share/nginx/html
COPY --from=build-stage /etc/ssl/private/ /etc/nginx/ssl/live/host

COPY ./conf /conf
COPY script/entrypoint.sh /script/entrypoint.sh
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

ENTRYPOINT ["/bin/bash","/script/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
