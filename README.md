# hapi-hemera

[![Build Status](https://travis-ci.org/hemerajs/hapi-hemera.svg?branch=master)](https://travis-ci.org/hemerajs/hapi-hemera)
[![NPM Downloads](https://img.shields.io/npm/dt/hapi-hemera.svg?style=flat)](https://www.npmjs.com/package/hapi-hemera)
[![npm](https://img.shields.io/npm/v/hapi-hemera.svg?maxAge=3600)](https://www.npmjs.com/package/hapi-hemera)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

**hapi-hemera** is a [**Hemera**](https://github.com/hemerajs/hemera) micro-services plugin
for [Hapi](https://github.com/hapijs/hapi) **17+**. The plugin integrates the **Hemera** functionality into
**hapi**.

## Plugin Registration

```js
const server = new Hapi.Server()
await server.register({
  plugin: require('hapi-hemera'),
  options: {
    hemera: {
      name: 'test',
      logLevel: 'info'
    },
    nats: 'nats://localhost:4242',
    // If you want to add hemera plugins
    plugins: [require('hemera-joi')]
  }
})
```

## Plugin registration with a custom Hemera instance

```js
const server = new Hapi.Server()
const hemeraInstance = new Hemera()
await server.register({
  plugin: require('hapi-hemera'),
  options: {
    hemeraInstance: hemeraInstance,
    nats: 'nats://localhost:4242'
  }
})
```

## Use toolkit decorator

```js
server.route({
  method: 'POST',
  path: '/add',
  handler: function (request, h) {
    return h.hemera().act({ topic: 'math', cmd: 'add', a: 2, b: 2 })
  }
}
```

## Use server decorator

```js
server.route({
  method: 'POST',
  path: '/add',
  handler: async function (request, h) {
    let resp = server.hemera.act({ topic: 'math', cmd: 'add', a: 2, b: 2 })
    // access result
    resp.data
    // retain parent context
    resp = resp.context.act(...)
  }
}
```

## Use request decorator

```js
server.route({
  method: 'POST',
  path: '/add',
  handler: function (request, h) {
    return request.hemera.act({ topic: 'math', cmd: 'add', a: 2, b: 2 })
  }
}
```

## Server methods

```js
server.action('generate', {
  topic: 'generator',
  cmd: 'id'
})
const result = await server.methods.generate()
```

## Use handler decorator and accept `params`, `query` and `payload` as pattern

```js
server.route({
  method: 'GET',
  path: '/api/add',
  handler: {
    hemera: {
      pattern: {
        topic: 'math',
        cmd: 'add'
      }
    }
  }
})
```

## Gracefully shutdown

We hook into Hapi `onPostStop` event to gracefully shutdown hemera.

## Enrich pattern with contextual data

```js
server.register({
    plugin: HapiHemera,
    options: {
      basePattern: function (request) {
        return {
          trace$: {
            traceId: request.headers['x-request-id']
          }
        }
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
