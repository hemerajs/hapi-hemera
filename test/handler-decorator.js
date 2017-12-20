'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')
const HemeraTestsuite = require('hemera-testsuite')

const expect = Code.expect

describe('Handler decorator', function() {
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

  it('Should be able to use handler decorators with query', async () => {
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
      async req => parseInt(req.a) + parseInt(req.b)
    )

    server.route({
      method: 'GET',
      path: '/api/add',
      handler: {
        hemera: {
          pattern: {
            topic: 'math',
            cmd: 'add'
          }
        }
      }
    })

    const resp = await server.inject({
      method: 'GET',
      url: '/api/add?a=1&b=2'
    })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal(3)

    await server.stop()
  })

  it('Should be able to use handler decorators with payload', async () => {
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
      async req => parseInt(req.a) + parseInt(req.b)
    )

    server.route({
      method: 'POST',
      path: '/api/add',
      handler: {
        hemera: {
          pattern: {
            topic: 'math',
            cmd: 'add'
          }
        }
      }
    })

    const resp = await server.inject({
      method: 'POST',
      url: '/api/add',
      payload: { a: 1, b: 2 }
    })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal(3)

    await server.stop()
  })

  it('Should be able to use handler decorators with params', async () => {
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
      async req => parseInt(req.a) + parseInt(req.b)
    )

    server.route({
      method: 'GET',
      path: '/api/add/{a}/{b}',
      handler: {
        hemera: {
          pattern: {
            topic: 'math',
            cmd: 'add'
          }
        }
      }
    })

    const resp = await server.inject({
      method: 'GET',
      url: '/api/add/1/2'
    })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal(3)

    await server.stop()
  })
})
