FROM node@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1

ARG ROOK_VERSION
ARG ROOK_NPM_INTEGRITY
ARG ROOK_GIT_HEAD
ARG ROOK_BUILD_ENV

WORKDIR /opt/rook
COPY package.json package-lock.json ./
RUN node -e 'const {ROOK_VERSION:v,ROOK_NPM_INTEGRITY:i,ROOK_GIT_HEAD:g,ROOK_BUILD_ENV:e}=process.env; const p=require("./package-lock.json").packages["node_modules/@testmuai/rook"]; if(!/^\d+\.\d+\.\d+$/.test(v)||!/^sha512-[A-Za-z0-9+/=]+$/.test(i)||!/^[0-9a-f]{40}$/.test(g)||!["stage","prod"].includes(e)||p.version!==v||p.integrity!==i) process.exit(1)'
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
RUN node -e 'if(require("./node_modules/@testmuai/rook/package.json").version!==process.env.ROOK_VERSION) process.exit(1)'

COPY jsonrpc-client.mjs /opt/rook-benchmark/jsonrpc-client.mjs
ENV ROOK_SYSTEM_NODE=1
ENV ROOK_BUILD_ENV=$ROOK_BUILD_ENV
LABEL org.opencontainers.image.source="https://github.com/4DvAnCeBoY/rook-benchmark-runtime" \
      org.opencontainers.image.version=$ROOK_VERSION \
      org.opencontainers.image.revision=$ROOK_GIT_HEAD \
      ai.rook.benchmark.npm-integrity=$ROOK_NPM_INTEGRITY \
      ai.rook.benchmark.environment=$ROOK_BUILD_ENV
RUN ln -s /opt/rook/node_modules/.bin/rook /usr/local/bin/rook \
    && chmod 0555 /opt/rook-benchmark/jsonrpc-client.mjs \
    && ln -s /opt/rook-benchmark/jsonrpc-client.mjs /usr/local/bin/rook-benchmark-jsonrpc \
    && mkdir /tmp/rook-image-smoke-home \
    && test "$(HOME=/tmp/rook-image-smoke-home /usr/local/bin/rook --version)" = "$ROOK_VERSION" \
    && rm -rf /tmp/rook-image-smoke-home

ENTRYPOINT ["/usr/local/bin/rook"]
