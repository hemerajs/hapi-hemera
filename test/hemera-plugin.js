'use strict'

const Hapi = require('hapi')
const HemeraTestsuite = require('hemera-testsuite')
const Code = require('code')
const HapiHemera = require('../lib')

const expect = Code.expect

process.setMaxListeners(0)

describe('Hemera plugin registration', function() {
  const PORT = 6242
  const noAuthUrl = 'nats://localhost:' + PORT
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

    const myPlugin = async function myPlugin(hemera, options) {}

    myPlugin[Symbol.for('dependencies')] = []
    myPlugin[Symbol.for('name')] = 'myPlugin'
    myPlugin[Symbol.for('options')] = { a: 1 }

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
    expect(server.hemera.plugins.myPlugin.plugin$.options).to.be.equals({
      a: 1
    })

    await server.stop()
  })
})
