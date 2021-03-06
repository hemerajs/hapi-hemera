'use strict'

const Code = require('code')
const Hapi = require('hapi')
const Hemera = require('nats-hemera')
const Nats = require('nats')
const HemeraTestsuite = require('hemera-testsuite')
const HapiHemera = require('../')

const { expect } = Code

describe('Custom Hemera instance', function() {
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

  it('Connect to NATS', async () => {
    const server = new Hapi.Server()
    const hemeraInstance = new Hemera(Nats.connect({ url: noAuthUrl }))
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
    const hemeraInstance = new Hemera(Nats.connect({ url: noAuthUrl }))
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
