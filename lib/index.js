'use strict'

const Hoek = require('hoek')
const Hemera = require('nats-hemera')
const Nats = require('nats')
const Tinysonic = require('tinysonic')
const Promisify = require('util').promisify

const internals = {
  defaults: {
    // see https://github.com/hemerajs/hemera
    hemera: {},
    // see https://github.com/nats-io/node-nats
    nats: {},
    // here you can enrich the base pattern (object or function)
    basePattern: request => {}
  }
}

async function register(server, options) {
  const settings = Hoek.applyToDefaults(internals.defaults, options)
  const hemera = new Hemera(Nats.connect(settings.nats), settings.hemera)

  if (options.plugins) {
    options.plugins.forEach(plugin => hemera.use(plugin))
  }

  const hemeraInterface = request => {
    return {
      act(pattern) {
        return hemera.act(this.pattern(pattern))
      },
      add(pattern, reply) {
        return hemera.add(pattern, reply)
      },
      pattern(pattern) {
        if (typeof pattern === 'string') {
          pattern = Tinysonic(pattern)
        }
        return Object.assign(
          pattern,
          internals.getBasePattern(request, settings.basePattern)
        )
      }
    }
  }

  const hemeraRequestDecoration = request => hemeraInterface(request)
  const hemeraToolkitDecoration = function() {
    return hemeraInterface(this.request)
  }

  server.decorate('server', 'hemera', hemera)
  server.decorate('server', 'action', internals.action(server))
  server.decorate('toolkit', 'hemera', hemeraToolkitDecoration)
  server.decorate('handler', 'hemera', internals.handler)
  server.decorate('request', 'hemera', hemeraRequestDecoration, {
    apply: true
  })

  server.ext('onPostStop', async server => {
    return Promisify(hemera.close.bind(hemera))()
  })

  await Promisify(hemera.ready.bind(hemera))()
}

internals.handler = function(route, options) {
  return function(request, h) {
    return request.hemera.act(
      internals.getPatternFromRequest(request, options.pattern)
    )
  }
}

internals.getPatternFromRequest = function(request, defaultPattern) {
  let message = Object.create(defaultPattern)

  if (request.params) {
    message = Hoek.applyToDefaults(message, request.params)
  }

  if (request.query) {
    message = Hoek.applyToDefaults(message, request.query)
  }

  if (request.payload) {
    message = Hoek.applyToDefaults(message, request.payload)
  }

  return message
}

internals.action = function(server) {
  return function(name, pattern) {
    const method = function(additions) {
      if (additions) {
        return server.hemera.act(Hoek.applyToDefaults(pattern, additions))
      }
      return server.hemera.act(pattern)
    }
    return server.method(name, method)
  }
}

internals.getBasePattern = function(request, basePattern) {
  let obj = {}

  if (typeof basePattern === 'function') {
    obj = basePattern(request) || {}
  } else {
    obj = basePattern || {}
  }

  return obj
}

module.exports = {
  register,
  pkg: require('../package.json')
}
