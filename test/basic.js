'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')

const { expect } = Code

describe('Basic', function() {
  const noAuthUrl = process.env.NATS_URL || `nats://localhost:4222`

  it('Connect to NATS', async () => {
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
    await server.stop()
  })

  it('Add / Act', async () => {
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

    let id = 0
    server.hemera.add(
      {
        topic: 'generator',
        cmd: 'id'
      },
      async () => {
        return { id: ++id }
      }
    )

    const resp = await server.hemera.act({
      topic: 'generator',
      cmd: 'id'
    })

    expect(resp.data).to.equal({
      id: 1
    })

    await server.stop()
  })
})
