'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HemeraTestsuite = require('hemera-testsuite')
const HapiHemera = require('../')

const { expect } = Code

describe('Base Pattern', function() {
  const PORT = 6242
  const noAuthUrl = `nats://localhost:${PORT}`
  let natsServer

  // Start up our own nats-server
  before(function(done) {
    natsServer = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function() {
    natsServer.kill()
  })

  it('Should be able to create base pattern with function', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        basePattern() {
          const basePattern = {
            a: 1
          }
          return basePattern
        },
        nats: {
          url: noAuthUrl
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/api/add',
      handler(request) {
        return request.hemera.pattern({ b: 2 })
      }
    })

    const resp = await server.inject({ method: 'GET', url: '/api/add' })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal({ a: 1, b: 2 })

    await server.stop()
  })

  it('Should be able to create base pattern with object', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        basePattern: {
          a: 1
        },
        nats: {
          url: noAuthUrl
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/api/add',
      handler(request) {
        return request.hemera.pattern({ b: 2 })
      }
    })

    const resp = await server.inject({ method: 'GET', url: '/api/add' })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal({ a: 1, b: 2 })

    await server.stop()
  })

  it('Should include base pattern when we act', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        basePattern: {
          a: 1,
          b: 2
        },
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
      handler(request) {
        return request.hemera.act({
          topic: 'math',
          cmd: 'add'
        })
      }
    })

    const resp = await server.inject({ method: 'GET', url: '/api/add' })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal(3)

    await server.stop()
  })
})
