/*global it describe before after*/

'use strict';

// Load modules

const
  Hapi = require('hapi'),
  HemeraTestsuite = require('hemera-testsuite'),
  Code = require('code'),

  HapiHemera = require('../lib')

const expect = Code.expect

process.setMaxListeners(0);

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

  it('Register plugin', (done) => {

    const server = new Hapi.Server()
    server.connection();
    server.register(HapiHemera, (err) => {

      expect(err).to.not.exist();
      expect(server.hemera).to.exist();

      server.hemera.add({
        topic: 'math',
        cmd: 'add'
      }, (args, next) => {

        next(null, args.a + args.b);
      });

      server.hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2,
        timeout$: 5000
      }, (err, resp) => {

        expect(err).to.not.exist();
        expect(resp).to.exist();
        done();
      });
    })
  })
})
