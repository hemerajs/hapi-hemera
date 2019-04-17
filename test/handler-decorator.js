'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')

const { expect } = Code

describe('Handler decorator', function() {
  const noAuthUrl = process.env.NATS_URL || `nats://localhost:4222`

  it('Should be able to use handler decorators with query', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        hemera: {
          logLevel: 'silent'
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
        hemera: {
          logLevel: 'silent'
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
        hemera: {
          logLevel: 'silent'
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
