'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

describe('Request Id', function () {
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

  it('Should be able to get the requestId from the x-request-id header', (done) => {
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

      server.hemera.add({
        topic: 'generator',
        cmd: 'id'
      }, function (message, next) {
        expect(this.request$.parentId).to.equals(323)
        return next(null, true)
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

      server.inject({
        url: '/',
        headers: {
          'x-request-id': 323
        }
      }, (res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.result).to.equal(true)
        server.hemera.close()
        done()
      })
    })
  })
})
