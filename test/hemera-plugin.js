'use strict'

const Hapi = require('hapi')
const HemeraTestsuite = require('hemera-testsuite')
const hemeraInternalSymbols = require('nats-hemera/lib/symbols')
const Code = require('code')
const Hp = require('hemera-plugin')
const HapiHemera = require('../lib')

const { expect } = Code

describe('Hemera plugin registration', function() {
  const PORT = 6242
  const noAuthUrl = `nats://localhost:${PORT}`
  let natsServer

  // Start up our own nats-server
  before(done => {
    natsServer = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(() => {
    natsServer.kill()
  })

  it('Should be able to register a plugin', async () => {
    const server = new Hapi.Server()

    const myPlugin = Hp(
      function myPlugin(instance, options, cb) {
        cb()
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

    await server.register({
      plugin: HapiHemera,
      options: {
        plugins: [myPlugin],
        nats: {
          url: noAuthUrl
        }
      }
    })
    expect(server.hemera).to.exist()
    expect(server.hemera[hemeraInternalSymbols.sRegisteredPlugins]).to.be.equals(['myPlugin'])

    await server.stop()
  })

  it('Should be able to register a plugin with options', async () => {
    const server = new Hapi.Server()

    const myPlugin = Hp(
      async function myPlugin(hemera, options) {
        expect(options).to.be.equals({ a: 1, b: 2 })
      },
      {
        name: 'myPlugin',
        options: { a: 1 }
      }
    )

    await server.register({
      plugin: HapiHemera,
      options: {
        plugins: [{ register: myPlugin, options: { b: 2 } }],
        nats: {
          url: noAuthUrl
        }
      }
    })

    expect(server.hemera).to.exist()
    expect(server.hemera[hemeraInternalSymbols.sRegisteredPlugins]).to.be.equals(['myPlugin'])

    await server.stop()
  })
})
