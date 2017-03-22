/*global it describe before after*/

'use strict'

// Load modules

const
  Hapi = require('hapi'),
  HemeraTestsuite = require('hemera-testsuite'),
  Code = require('code'),

  HapiHemera = require('../lib')

const expect = Code.expect

process.setMaxListeners(0)

describe('Basic', function () {

  let natsServer

  // Start up our own nats-server
  before((done) => {

    natsServer = HemeraTestsuite.start_server(6242, [], done)
  })

  // Shutdown our server after we are done
  after(() => {

    natsServer.kill()
  })

  it('Register plugin with method configuration', (done) => {

    const server = new Hapi.Server({
      cache: {
        engine: require('catbox-memory'),
        shared: true
      }
    })
    server.connection()
    server.register({
      register: HapiHemera,
      options: {
        nats: 'nats://localhost:6242',
        methods: {
          foo: {
            pattern: {
              topic: 'math',
              cmd: 'add',
              timeout$: 5000,
            }
          },
          fooCached: {
            pattern: {
              topic: 'math',
              cmd: 'add'
            },
            cache: {
              expiresIn: 60000,
              staleIn: 30000,
              staleTimeout: 10000,
              generateTimeout: 100
            }
          }
        }
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

      server.methods.foo({
        a: 1,
        b: 2
      }, (err, resp) => {

        expect(err).to.not.exist()
        expect(resp).to.exist()

        server.methods.fooCached({
          a: 1,
          b: 2
        }, (err, resp) => {

          expect(err).to.not.exist()
          expect(resp).to.exist()
          done()
        })
      })
    })
  })
})
