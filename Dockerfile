FROM mhart/alpine-node:8.10.0
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
