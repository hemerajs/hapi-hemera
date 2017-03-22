'use strict';

// Load modules

const Hoek = require('hoek')
const Hemera = require('nats-hemera')

// Declare internals

const internals = {
  defaults: {
    // see https://github.com/hemerajs/hemera
    hemera: {},
    // see https://github.com/nats-io/node-nats
    nats: {}
  }
}

exports.register = function (server, options, next) {

  const settings = Hoek.applyToDefaults(internals.defaults, options)

  const hemera = new Hemera(
    require('nats').connect(settings.nats),
    settings.hemera
  )

  internals.addMethods(server, settings);

  server.decorate('server', 'hemera', hemera)
  server.decorate('request', 'hemera', () => hemera, {
    apply: true
  })

  server.decorate('reply', 'act', internals.replyAct)
  server.handler('act', internals.handlerAct)

  hemera.ready(() => {

    return next()
  })
}

exports.register.attributes = {
  pkg: require('../package.json')
}

internals.replyAct = function (pattern) {

  this.request.hemera.act(pattern, (err, result) => {

    this.response(err || result)
  })
}

internals.handlerAct = function (route, options) {

  return function (request, reply) {

    let message = Object.create(options.pattern);

    if (request.params) {

      message = Hoek.applyToDefaults(message, request.params);
    }

    if (request.query) {

      message = Hoek.applyToDefaults(message, request.query);
    }

    if (request.payload) {
      message = Hoek.applyToDefaults(message, request.payload);
    }

    return reply.act(message)
  }
}

// Add server methods
internals.addMethods = function (server, settings) {

  for (let key in settings.methods) {

    let options = settings.methods[key]

    let func = (args, next) => {

      let message = Hoek.applyToDefaults(options.pattern, args);
      server.hemera.act(message, (err, resp) => {

        next(err, resp)
      });
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

      result = result + encodeURIComponent(key) + ':' +
        encodeURIComponent(value.toString())
    }

    return result
  }
}
