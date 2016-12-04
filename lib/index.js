'use strict';

// Load modules

const Hoek = require('hoek')
const Items = require('items')
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

    hemera.ready(() => {

        return next()
    })
}

exports.register.attributes = {
    pkg: require('../package.json')
}