'use strict';

// Load modules

const Hoek = require('hoek')
const Hemera = require('nats-hemera')

// Declare internals

const internals = {
  defaults: {
    // see https://github.com/hemerajs/hemera
    hemera: {
      logLevel: 'info'
    },
    natsUrl: 'nats://localhost:6242'
  }
}

exports.register = function (server, options, next) {

  const settings = Hoek.applyToDefaults(
    internals.defaults, options);

  const hemera = new Hemera(
    require('nats').connect(settings.natsUrl),
    settings.hemera
  );

  server.decorate('server', 'hemera', hemera)

  // Add server methods 💩
  for (let key in settings.methods) {

    let methodOptions = settings.methods[key];

    let func = (args, next) => {

      let msg = Object.create(args)
      msg.topic = methodOptions.topic;
      msg.cmd = methodOptions.cmd;
      if (methodOptions.timeout) {
        msg.timeout$ = methodOptions.timeout;
      }

      server.hemera.act(msg, (err, resp) => {

        next(err, resp);
      });
    }

    let foo = {};
    if (methodOptions.cache) {
      foo.cache = methodOptions.cache
    }

    server.method(key, func, foo);
  }

  hemera.ready(() => {

    return next()
  })
}

exports.register.attributes = {
  pkg: require('../package.json')
}
