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
    hemera:{
      logLevel: 'info' 
    },
    nats: 'nats://localhost:6242',
    
    // In case you want to use hapi server methods
    methods: {
      add: {
        pattern: {
          topic: 'math',
          cmd: 'add',
          timeout$: 5000,
        }
        // Optional caching parameters 
        cache: {
          expiresIn: 60000,
          staleIn: 30000,
          staleTimeout: 10000,
          generateTimeout: 100
        }
      }
    }
  }
})
```

#### Use reply interface
```js
server.route({
  method: 'POST',
  path: '/add',
  handler: function (request, reply) {

    return reply.act({ topic: 'math', cmd: 'add', a: 2, b: 2 })
  }
}
```

#### Use hemera instance
```js
server.route({
  method: 'POST',
  path: '/add',
  handler: function (request, reply) {

    return reply.hemera.act({ topic: 'math', cmd: 'add', a: 2, b: 2 },
      function(err, result) {

        reply(err || result)
      })
  }
}
```

#### Use server methods
```js
server.route({
  method: 'POST',
  path: '/add',
  handler: function (request, reply) {

    server.methods.add({ a: 1, b: 2 }, (err, resp) => {
      
      reply(err || result)
    }) 
  }
}
```
### Use server handlers 

Use body 
```js
server.route({
  method: 'POST',
  path: '/foo/{topic}/{cmd}',
  handler: {
    act: {
      pattern: {
        timeout$: 5000
      }
    }
  }
})
```

```curl
 curl -H "Content-Type: application/json" -X POST -d \
 '{"a":2,"b":2}' http://localhost:3000/foo/math/add
```

use query parameters 
```js
server.route({
  method: 'POST',
  path: '/math/{cmd}',
  config: {
    validate: {
      query: {
        a: Joi.number().required(),
        b: Joi.number().required()
      }
    }
  },
  handler: {
    act: {
      pattern: {
        topic: 'math',
        timeout$: 5000
      }
    }
  }
})
```
```curl
 curl http://localhost:3000/foo/math/add?a=2&b=2
```
