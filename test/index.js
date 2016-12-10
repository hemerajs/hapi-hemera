'use strict'

// Load modules

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

describe('Basic', function () {

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

  it('Connect to NATS', function (done) {

    const server = new Hapi.Server()

    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        hemera: {},
        nats: {
          url: noAuthUrl
        }
      }
    }, (err) => {

      expect(err).to.not.exist()
      server.hemera.close()
      done()
    })
  })

  it('Exposes a hemera instance', (done) => {

    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
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

      server.hemera.act({
        topic: 'generator',
        cmd: 'id'
      }, (err, result) => {

        expect(err).to.not.exist()
        expect(result).to.equal({
          id: 1
        })
        server.hemera.close()
        done()
      })

    })
  })

  it('Maps an action to a server method', (done) => {

    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
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

      server.action('generate', 'topic:generator,cmd:id')

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

  it('Maps an action to a server method (object pattern)', (done) => {

    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
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

      server.action('generate', {
        topic: 'generator',
        cmd: 'id'
      })

      server.methods.generate((err, result) => {

        expect(err).to.not.exist()
        expect(result).to.equal({
          id: 1
        })
        server.hemera.close()
        done()
      })
    })
  })

  it('Maps an action to a server method (cached)', (done) => {

    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
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

      server.action('generate', 'topic:generator,cmd:id', {
        cache: {
          expiresIn: 1000,
          generateTimeout: 3000
        }
      })

      server.start(() => {

        server.methods.generate((err, result1) => {

          expect(err).to.not.exist()
          expect(result1).to.equal({
            id: 1
          })

          server.methods.generate((err, result2) => {

            expect(err).to.not.exist()
            expect(result2).to.equal({
              id: 1
            })
            server.hemera.close()
            done()
          })
        })
      })
    })
  })

  it('Returns act result', (done) => {

    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
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

        return reply.act({
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
})
