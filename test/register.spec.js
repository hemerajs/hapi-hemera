'use strict'

const Hapi = require('hapi')
const HemeraTestsuite = require('hemera-testsuite')
const Code = require('code')
const HapiHemera = require('../lib')

const expect = Code.expect

process.setMaxListeners(0)

describe('Register', function () {
  let natsServer

  // Start up our own nats-server
  before((done) => {
    natsServer = HemeraTestsuite.start_server(6242, [], done)
  })

  // Shutdown our server after we are done
  after(() => {
    natsServer.kill()
  })

  it('Register plugin and check if exposed', (done) => {
    const server = new Hapi.Server()
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        nats: 'nats://localhost:6242'
      }
    }, (err) => {
      expect(err).to.not.exist()
      expect(server.hemera).to.exist()

      server.hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (args, next) => {
        next(null, args.a + args.b)
      })

      server.hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        timeout$: 5000
      }, (err, resp) => {
        expect(err).to.not.exist()
        expect(resp).to.exist()
        done()
      })
    })
  })
})
