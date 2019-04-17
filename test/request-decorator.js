'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')

const { expect } = Code

describe('Request decorator', function() {
  const noAuthUrl = process.env.NATS_URL || `nats://localhost:4222`

  it('Should be able to act with request hemera instance', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        basePattern: {
          a: 1,
          b: 2
        },
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
