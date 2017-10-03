'use strict'

const Hapi = require('hapi')
const HemeraTestsuite = require('hemera-testsuite')
const Code = require('code')
const HapiHemera = require('../lib')

const expect = Code.expect

process.setMaxListeners(0)

describe('Hemera plugin registration', function () {
  let natsServer

  // Start up our own nats-server
  before((done) => {
    natsServer = HemeraTestsuite.start_server(6242, [], done)
  })

  // Shutdown our server after we are done
  after(() => {
    natsServer.kill()
  })

  it('Should be able to register a plugin', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        nats: 'nats://localhost:6242',
        plugins: [{
          plugin: function plugin (hemera, opts, done) { done() },
          options: { name: 'myPlugin', a: 1 }
        }]
      }
    }, (err) => {
      expect(err).to.not.exist()
      expect(server.hemera).to.exist()
      expect(server.hemera.plugins.myPlugin.plugin$.options).to.be.equals({ name: 'myPlugin', a: 1 })
      server.stop(done)
    })
  })

  it('Should be able to register a plugin and pass configuration as second argument', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        nats: 'nats://localhost:6242',
        plugins: [{
          register: {
            plugin: function plugin (hemera, opts, done) { done() },
          },
          options: {  name: 'myPlugin', a: 1 }
        }]
      }
    }, (err) => {
      expect(err).to.not.exist()
      expect(server.hemera).to.exist()
      expect(server.hemera.plugins.myPlugin.plugin$.options).to.be.equals({ name: 'myPlugin', a: 1 })
      server.stop(done)
    })
  })
})
