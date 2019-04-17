'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')

const { expect } = Code

describe('Toolkit decorator', function() {
  const noAuthUrl = process.env.NATS_URL || `nats://localhost:4222`

  it('Should be able to act with toolkit hemera interface', async () => {
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
      async req => req.a + req.b
    )

    server.route({
      method: 'GET',
      path: '/api/add',
      handler(request, h) {
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
