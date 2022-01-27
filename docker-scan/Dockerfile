FROM node:16-alpine

# install docker
RUN apk add --update curl docker openrc
RUN rc-update add docker boot

# install scan-cli-plugin
RUN mkdir -p ~/.docker/cli-plugins && \
    curl https://github.com/docker/scan-cli-plugin/releases/latest/download/docker-scan_linux_amd64 -L -s -S -o ~/.docker/cli-plugins/docker-scan && \
    chmod +x ~/.docker/cli-plugins/docker-scan

WORKDIR /docker-scan
COPY package*.json ./
RUN npm install --quiet
COPY src/ ./src/

EXPOSE 3000
EXPOSE 9229

CMD [ "npm", "run", "start" ]