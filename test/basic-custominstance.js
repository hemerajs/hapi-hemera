'use strict'

const Code = require('code')
const Hapi = require('hapi')
const Hemera = require('nats-hemera')
const Nats = require('nats')
const HapiHemera = require('../')

const { expect } = Code

describe('Custom Hemera instance', function() {
  const noAuthUrl = process.env.NATS_URL || `nats://localhost:4222`

  it('Connect to NATS', async () => {
    const server = new Hapi.Server()
    const hemeraInstance = new Hemera(Nats.connect({ url: noAuthUrl }), {
      logLevel: 'silent'
    })
    await server.register({
      plugin: HapiHemera,
      options: {
        hemeraInstance
      }
    })
    await server.stop()
  })

  it('Add / Act', async () => {
    const server = new Hapi.Server()
    const hemeraInstance = new Hemera(Nats.connect({ url: noAuthUrl }), {
      logLevel: 'silent'
    })
    await server.register({
      plugin: HapiHemera,
      options: {
        hemeraInstance
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
