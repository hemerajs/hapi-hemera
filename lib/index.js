'use strict'

const Hoek = require('hoek')
const Hemera = require('nats-hemera')
const Nats = require('nats')

const internals = {
  defaults: {
    // see https://github.com/hemerajs/hemera
    hemera: {},
    // see https://github.com/nats-io/node-nats
    nats: {}
    // prefix to customize hapi decorations
    // decoratePrefix: ''
  }
}

exports.register = function (server, options, next) {
  const settings = Hoek.applyToDefaults(internals.defaults, options)
  const hemera = new Hemera(
    Nats.connect(settings.nats),
    settings.hemera)

  if (options.plugins) {
    options.plugins.forEach((plugin) => {
      if (plugin.plugin) {
        hemera.use(plugin)
      } else {
        hemera.use(plugin.register, plugin.options)
      }
    })
  }

  internals.addMethods(server, settings)

  server.decorate('server', 'hemera', hemera)
  server.decorate('request', 'hemera', () => hemera, {
    apply: true
  })

  if (options.decoratePrefix) {
    server.decorate('server', `${options.decoratePrefix}_action`, internals.action(server))
    server.decorate('reply', `${options.decoratePrefix}_act`, internals.replyAct)
    server.handler(`${options.decoratePrefix}_act`, internals.handlerAct)
  } else {
    server.decorate('server', 'action', internals.action(server))
    server.decorate('reply', 'act', internals.replyAct)
    server.handler('act', internals.handlerAct)
  }

  hemera.ready(() => {
    return next()
  })
}

internals.replyAct = function (pattern) {
  pattern.requestParentId$ = this.request.headers['x-request-id'] || this.request.id
  this.request.hemera.act(pattern, (err, result) => {
    this.response(err || result)
  })
}

internals.action = function (server) {
  return function (name, pattern, options) {
    const method = function (additions, callback) {
      if (typeof additions === 'function') {
        callback = additions
        additions = null
      }

      if (additions) {
        return server.hemera.act(Hoek.applyToDefaults(pattern, additions), callback)
      }

      return server.hemera.act(pattern, callback)
    }

    if (options &&
      options.cache) {
      const settings = Hoek.applyToDefaults(internals.cache, options)

      return server.method(name, method, settings)
    }

    return server.method(name, method)
  }
}

internals.handlerAct = function (route, options) {
  return function (request, reply) {
    let message = Object.create(options.pattern)

    if (request.params) {
      message = Hoek.applyToDefaults(message, request.params)
    }

    if (request.query) {
      message = Hoek.applyToDefaults(message, request.query)
    }

    if (request.payload) {
      message = Hoek.applyToDefaults(message, request.payload)
    }

    request.hemera.act(message, (err, result) => {
      reply(err || result)
    })
  }
}

// Add server methods
internals.addMethods = function (server, settings) {
  for (let key in settings.methods) {
    let options = settings.methods[key]

    let func = (args, next) => {
      let message = Hoek.applyToDefaults(options.pattern, args)
      server.hemera.act(message, (err, resp) => {
        next(err, resp)
      })
    }

    if (options.cache) {
      server.method(key, func,
        Hoek.applyToDefaults(internals.cache, {
          cache: options.cache
        }))
    } else {
      server.method(key, func)
    }
  }
}

internals.cache = {
  generateKey: function (args) {
    if (!args) {
      return '{}'
    }

    const keys = Object.keys(args)

    let result = ''

    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i]
      const value = args[key]

      if (typeof value === 'object') {
        return null
      }

      if (i) {
        result = result + ','
      }

      result = result + encodeURIComponent(key) + ':' + encodeURIComponent(value.toString())
    }

    return result
  }
}

exports.register.attributes = {
  pkg: require('../package.json')
}
