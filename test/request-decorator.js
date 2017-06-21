'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

describe('Request decorator', function () {
  const PORT = 6242
  const noAuthUrl = 'nats://localhost:' + PORT
  const flags = []
  let natsServer

  // Start up our own nats-server
  before(function (done) {
    natsServer = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    natsServer.kill()
  })

  it('Should be able to act with request hemera instance', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        hemera: {},
        basePattern: function (request) {
          const basePattern = {
            a: 1
          }

          return basePattern
        },
        nats: {
          url: noAuthUrl
        }
      }
    }, (err) => {
      expect(err).to.not.exist()

      server.hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (message, next) => {
        return next(null, { result: message.a + message.b })
      })

      server.route({
        method: 'GET',
        path: '/api/add',
        handler: function (request, reply) {
          request.hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2 }, function (err, result) {
            reply(result)
          })
        }
      })
      server.inject({ method: 'GET', url: '/api/add' }, (res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.result).to.equal({ result: 3 })
        done()
      })
    })
  })

  it('Should support string pattern in act and add', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        hemera: {},
        basePattern: function (request) {
          const basePattern = {
            a: 1
          }

          return basePattern
        },
        nats: {
          url: noAuthUrl
        }
      }
    }, (err) => {
      expect(err).to.not.exist()

      server.route({
        method: 'GET',
        path: '/api/add',
        handler: function (request, reply) {
          request.hemera.add('topic:math,cmd:add', (message, next) => {
            return next(null, { result: message.a + message.b })
          })

          request.hemera.act('topic:math,cmd:add,a:1,b:2', function (err, result) {
            reply(result)
          })
        }
      })
      server.inject({ method: 'GET', url: '/api/add' }, (res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.result).to.equal({ result: 3 })
        done()
      })
    })
  })

  it('Should be able to add with request hemera instance', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        hemera: {},
        basePattern: function (request) {
          const basePattern = {
            a: 1
          }

          return basePattern
        },
        nats: {
          url: noAuthUrl
        }
      }
    }, (err) => {
      expect(err).to.not.exist()

      server.route({
        method: 'GET',
        path: '/api/add',
        handler: function (request, reply) {
          request.hemera.add({
            topic: 'math',
            cmd: 'add'
          }, (message, next) => {
            return next(null, { result: message.a + message.b })
          })

          request.hemera.act({ topic: 'math', cmd: 'add', a: 1, b: 2 }, function (err, result) {
            reply(result)
          })
        }
      })
      server.inject({ method: 'GET', url: '/api/add' }, (res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.result).to.equal({ result: 3 })
        done()
      })
    })
  })
})
