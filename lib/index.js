'use strict'

const Hoek = require('hoek')
const Hemera = require('nats-hemera')
const Nats = require('nats')
const Tinysonic = require('tinysonic')

const internals = {
  defaults: {
    // see https://github.com/hemerajs/hemera
    hemera: {},
    // see https://github.com/nats-io/node-nats
    nats: {},
    // here you can enrich the base pattern (object or function)
    // eslint-disable-next-line no-unused-vars
    basePattern: request => {}
  }
}

async function register(server, options) {
  const settings = Hoek.applyToDefaults(internals.defaults, options)

  const useHemeraInstance = !!options.hemeraInstance

  const hemera = useHemeraInstance
    ? options.hemeraInstance
    : new Hemera(Nats.connect(settings.nats), settings.hemera)

  hemera.ext('onError', error => server.log(['hemera', 'reply', 'error'], error))

  if (useHemeraInstance === false && options.plugins) {
    options.plugins.forEach(plugin => {
      if (plugin.options) {
        hemera.use(plugin.register, plugin.options)
      } else {
        hemera.use(plugin)
      }
    })
  }

  const hemeraInterface = request => {
    return {
      async act(pattern) {
        return (await hemera.act(this.pattern(pattern))).data
      },
      add(pattern, reply) {
        return hemera.add(pattern, reply)
      },
      pattern(pattern) {
        if (typeof pattern === 'string') {
          // eslint-disable-next-line no-param-reassign
          pattern = Tinysonic(pattern)
        }
        return Object.assign(pattern, internals.getBasePattern(request, settings.basePattern))
      }
    }
  }

  const hemeraRequestDecoration = request => hemeraInterface(request)
  const hemeraToolkitDecoration = () => hemeraInterface(this.request)

  server.decorate('server', 'hemera', hemera)
  server.decorate('server', 'action', internals.action(server))
  server.decorate('toolkit', 'hemera', hemeraToolkitDecoration)
  server.decorate('handler', 'hemera', internals.handler)
  server.decorate('request', 'hemera', hemeraRequestDecoration, {
    apply: true
  })

  server.ext('onPostStop', () => hemera.close())

  if (useHemeraInstance === false) {
    await hemera.ready()
  }
}

internals.handler = (route, options) => {
  return function hemeraHapiHandler(request) {
    return request.hemera.act(internals.getPatternFromRequest(request, options.pattern))
  }
}

internals.getPatternFromRequest = (request, defaultPattern) => {
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

internals.action = server => {
  return (name, pattern) => {
    const method = async additions => {
      if (additions) {
        return (await server.hemera.act(Hoek.applyToDefaults(pattern, additions))).data
      }
      return (await server.hemera.act(pattern)).data
    }
    return server.method(name, method)
  }
}

internals.getBasePattern = (request, basePattern) => {
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
  // eslint-disable-next-line global-require
  pkg: require('../package.json')
}
