'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

describe('Prefix', function () {
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

  it('Server action', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        prefix: 'prefix',
        hemera: {},
        nats: {
          url: noAuthUrl
        }
      }
    }, (err) => {
      expect(err).to.not.exist()

      let id = 0
      server.hemera.add({
        topic: 'generator',
        cmd: 'id'
      }, (message, next) => {
        return next(null, {
          id: ++id
        })
      })

      server.prefixAction('generate', 'topic:generator,cmd:id')

      server.methods.generate((err, result) => {
        expect(err).to.not.exist()
        expect(result).to.equal({
          id: 1
        })

        server.methods.generate((err, result2) => {
          expect(err).to.not.exist()
          expect(result2).to.equal({
            id: 2
          })
          server.hemera.close()
          done()
        })
      })
    })
  })

  it('Reply Act', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        prefix: 'prefix',
        hemera: {},
        nats: {
          url: noAuthUrl
        }
      }
    }, (err) => {
      expect(err).to.not.exist()

      let id = 0
      server.hemera.add({
        topic: 'generator',
        cmd: 'id'
      }, (message, next) => {
        if (++id === 1) {
          return next(null, {
            id: 1
          })
        }

        return next(new Error('failed'))
      })

      const handler = function (request, reply) {
        return reply.prefixAct({
          topic: 'generator',
          cmd: 'id'
        })
      }

      server.route({
        method: 'GET',
        path: '/',
        handler
      })

      server.inject('/', (res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.result).to.equal({
          id: 1
        })

        server.inject('/', (res2) => {
          expect(res2.statusCode).to.equal(500)
          server.hemera.close()
          done()
        })
      })
    })
  })

  it('Handler act', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        prefix: 'prefix',
        nats: 'nats://localhost:6242'
      }
    }, (err) => {
      expect(err).to.not.exist()
      expect(server.hemera).to.exist()

      server.hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (args, next) => {
        next(null, args.a + args.b)
      })

      server.route({
        method: 'POST',
        path: '/foo/{topic}/{cmd}',
        handler: {
          prefixAct: {
            pattern: {
              timeout$: 5000
            }
          }
        }
      })

      server.inject({ method: 'POST', url: '/foo/math/add', payload: { a: 2, b: 2 } }, (res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.result).to.equal(4)
        done()
      })
    })
  })
})
