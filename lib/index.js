'use strict'

// Load modules

const Hoek = require('hoek')
const Hemera = require('nats-hemera')
const Nats = require('nats')
const Jsonic = require('jsonic')
const Schema = require('./schema')

// Declare internals

const internals = {
  replies: {},
  handlers: {},
  defaults: {
    // see https://github.com/hemerajs/hemera
    hemera: {},
    // see https://github.com/nats-io/node-nats
    nats: {}
  }
}

exports.register = function (server, options, next) {

  const settings = Hoek.applyToDefaults(internals.defaults, options)
  const nats = Nats.connect(settings.nats)

  const hemera = new Hemera(
    nats,
    settings.hemera
  )

  server.decorate('server', 'hemera', hemera)
  server.decorate('server', 'action', internals.action(server))
  server.decorate('request', 'hemera', () => hemera, {
    apply: true
  })

  server.decorate('reply', 'act', internals.replies.act)
  server.handler('act', internals.handlers.act)

  hemera.ready(() => {

    return next()
  })
}

exports.register.attributes = {
  pkg: require('../package.json')
}

internals.replies.act = function (pattern) {

  this.request.hemera.request$.id = this.request.headers['x-request-id'] || this.request.id

  this.request.hemera.act(pattern, (err, result) => {

    this.response(err || result)
  })
}

internals.handlers.act = function (route, options) {

  return function (request, reply) {

    let pattern = options

    if (typeof pattern === 'string') {
      const context = {
        params: request.params,
        query: request.query,
        payload: request.payload
      }

      pattern = Hoek.reachTemplate(context, pattern)
    }

    return reply.act(pattern)
  }
}

internals.action = function (server) {

  return function (name, pattern, options) {

    Schema.action(options, 'Invalid Action Schema') // Allow only cache option

    if (typeof pattern === 'string') {
      pattern = Jsonic(pattern)
    }

    const method = function (additions, callback) {

      if (typeof additions === 'function') {
        callback = additions
        additions = null
      }

      if (additions) {
        return server.hemera.act(Hoek.applyToDefaults(pattern, typeof additions === 'string' ? Jsonic(additions) : additions), callback)
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

internals.cache = {
  generateKey: function (additions) {

    if (!additions) {
      return '{}'
    }

    if (typeof additions === 'string') {
      additions = Jsonic(additions)
    }

    const keys = Object.keys(additions)

    let result = ''

    for (let i = 0; i < keys.length; ++i) {

      const key = keys[i]
      const value = additions[key]

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
