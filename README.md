# hapi-hemera
[![Build Status](https://travis-ci.org/hemerajs/hapi-hemera.svg?branch=master)](https://travis-ci.org/hemerajs/hapi-hemera)
[![NPM Downloads](https://img.shields.io/npm/dt/hapi-hemera.svg?style=flat)](https://www.npmjs.com/package/hapi-hemera)
[![npm](https://img.shields.io/npm/v/hapi-hemera.svg?maxAge=3600)](https://www.npmjs.com/package/hapi-hemera)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

- __Status:__ In development

**hapi-hemera** is a [**Hemera**](https://github.com/hemerajs/hemera) micro-services plugin
for [hapi](https://github.com/hapijs/hapi). The plugin integrates the **Hemera** functionality into
**hapi** and provide tools to map its actions to server methods and views for easy access.

### Usage

## Plugin Registration

```js
const server = new Hapi.Server()
server.connection()
server.register({
  register: require('hapi-hemera'),
  options: {
    hemera:{
      name: 'test',
      load: {
        sampleInterval: 1000
      },
      logLevel: 'info'
    },
    nats: 'nats://localhost:4242',
    // If you want to add hemera plugins
    plugins: [
      require('hemera-joi'),
      {
        register: require('hemera-stats'),
        options: { a: 1 }
      }
    ],
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

## Use reply interface
```js
server.route({
  method: 'POST',
  path: '/add',
  handler: function (request, reply) {

    return reply.act({ topic: 'math', cmd: 'add', a: 2, b: 2 })
  }
}
```

## Use hemera instance
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

## Use server methods
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

## Use action mapping
```js
// as string
server.action('generate', 'topic:generator,cmd:id')
// or as object
server.action('generate', {
  topic: 'generator',
  cmd: 'id'
})
// or with cache
server.action('generate', 'topic:generator,cmd:id', {
  cache: {
    expiresIn: 1000,
    generateTimeout: 3000
  }
})
// call
server.methods.generate((err, result) => {})
```

## Use server handlers 

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

```sh
 curl -H "Content-Type: application/json" -X POST -d '{"a":2,"b":2}' http://localhost:3000/foo/math/add
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

## Migrate from Seneca to Hemera

You can use the prefix options to avoid collision with existing decorators in Hapi.

```js
options: {
  prefix: 'hemera'
}

// Results in

reply.hemeraAct = Reply decorator
server.hemeraAction = Server decorator
hemeraAct = Custom Handler

```

## Enrich pattern with contextual data

```js
server.register({
    register: HapiHemera,
    options: {
      hemera: {},
      basePattern: function (request) {
        const basePattern = {
          trace$: {
            traceId: request.headers['x-request-id']
          }
        }

        return basePattern
      },
      nats: {
        url: noAuthUrl
      }
    }
})

// The basePattern is merged with the pattern

hemera.act({ a: 1 })

// Results in following pattern
 
 { a: 1, trace$: { traceId: 123 } }
 

```

### Example for [zipkin-instrumentation-hapi](https://github.com/openzipkin/zipkin-js/tree/master/packages/zipkin-instrumentation-hapi)

```js
basePattern: function(request) {
  return {
    trace$: {
      traceId: request.plugins.zipkin.traceId.traceId,
      spanId: request.plugins.zipkin.traceId.spanId,
      sampled: request.plugins.zipkin.traceId.sampled,
      flags: request.plugins.zipkin.traceId.flags
    }
  }
}
```
