'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

describe('Toolkit decorator', function() {
  const PORT = 6242
  const noAuthUrl = 'nats://localhost:' + PORT
  const flags = []
  let natsServer

  // Start up our own nats-server
  before(function(done) {
    natsServer = HemeraTestsuite.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function() {
    natsServer.kill()
  })

  it('Should be able to act with toolkit hemera interface', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        nats: {
          url: noAuthUrl
        }
      }
    })

    server.hemera.add(
      {
        topic: 'math',
        cmd: 'add'
      },
      async req => req.a + req.b
    )

    server.route({
      method: 'GET',
      path: '/api/add',
      handler: function(request, h) {
        return h.hemera().act({
          topic: 'math',
          cmd: 'add',
          a: 1,
          b: 2
        })
      }
    })

    const resp = await server.inject({ method: 'GET', url: '/api/add' })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal(3)

    await server.stop()
  })
})
