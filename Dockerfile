ARG BUILD_VERSION=8.10.0
FROM mhart/alpine-node:$BUILD_VERSION
MAINTAINER FelipeBarrosCruz <felipe.barros.pt@gmail.com>

RUN apk add --update \
  make \
  gcc \
  g++ \
  python \
  git

WORKDIR /src

ADD package.json package-lock.json ./
RUN npm install

ADD / ./

CMD ["npm", "run", "lib:test"]
