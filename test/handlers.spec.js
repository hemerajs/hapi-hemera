'use strict'

const Hapi = require('hapi')
const HemeraTestsuite = require('hemera-testsuite')
const Code = require('code')
const Joi = require('joi')
const HapiHemera = require('../lib')

const expect = Code.expect

process.setMaxListeners(0)

describe('Handlers', function () {
  let natsServer

  // Start up our own nats-server
  before((done) => {
    natsServer = HemeraTestsuite.start_server(6242, [], done)
  })

  // Shutdown our server after we are done
  after(() => {
    natsServer.kill()
  })

  it('Use handler act with payload', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
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
          act: {
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

  it('Use handler act with query params', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
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

      server.inject({ method: 'POST', url: '/math/add?a=2&b=2' }, (res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.result).to.equal(4)
        done()
      })
    })
  })

  it('Use default handler act with decorate prefix', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        nats: 'nats://localhost:6242',
        decoratePrefix: 'test'
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

      try {
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
      } catch (err) {
        expect(err).to.exist()
        expect(err.toString()).to.include('Unknown handler: act')
      }

      done()
    })
  })

  it('Use handler act with decorate prefix', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        nats: 'nats://localhost:6242',
        decoratePrefix: 'test'
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
          test_act: {
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
