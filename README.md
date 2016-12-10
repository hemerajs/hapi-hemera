# hapi-hemera
[![Build Status](https://travis-ci.org/hemerajs/hapi-hemera.svg?branch=master)](https://travis-ci.org/hemerajs/hapi-hemera)

- __Status:__ In development

**hapi-hemera** is a [**Hemera**](https://github.com/hemerajs/hemera) micro-services plugin
for [hapi](https://github.com/hapijs/hapi). The plugin integrates the **Hemera** functionality into
**hapi** and provide tools to map its actions to server methods and views for easy access.

### Usage

#### Plugin Registration

```js
const server = new Hapi.Server()
server.connection()
server.register({
  register: require('hapi-hemera'),
  options: {
    hemera: {},
    nats: {
      url: gnatsUrl
    }
  }
})
```

### Basic usage

#### Define
```js
server.hemera.add({
  topic: 'generator',
  cmd: 'id'
}, (message, next) => {
})
```

#### Use reply interface
```js
const handler = function (request, reply) {

  return reply.act({
    topic: 'generator',
    cmd: 'id'
  })
}
```

#### Use hemera instance
```js
const handler = function (request, reply) {

  return request.hemera.act({
    topic: 'generator',
    cmd: 'id'
  }, function(err, result) {

  })
}
```

#### Server methods
```js
server.action('generate', 'topic:generator,cmd:id')
// or ....
server.action('generate', 'topic:generator,cmd:id', {
  cache: {
    expiresIn: 1000,
    generateTimeout: 3000
  }
})

server.methods.generate((err, result) => {

})
```
