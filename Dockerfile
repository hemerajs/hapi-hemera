ARG BUILD_VERSION=8.10.0
FROM node:$BUILD_VERSION
MAINTAINER FelipeBarrosCruz <felipe.barros.pt@gmail.com>

WORKDIR /src

ADD package.json package-lock.json ./
RUN npm install

ADD / ./

CMD ["npm", "run", "lib:test"]
