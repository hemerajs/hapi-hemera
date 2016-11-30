'use strict';

// Load modules

const Hoek = require('hoek')
const Items = require('items')
const Hemera = require('hemera')
const Nats = require('nats')

// Declare internals

const internals = {
    defaults: {
        // see https://github.com/hemerajs/hemera
        hemera: {},
        // see https://github.com/nats-io/node-nats
        nats: {}
    }
}

exports.register = function (server, options, next) {

    const settings = Hoek.applyToDefaults(internals.defaults, options)

    const nats = Nats.connect(settings.nats)
    const hemera = new Hemera(nats, settings.hemera)

    hemera.ready(() => {
        
        return next()
    }) 
}

exports.register.attributes = {
    pkg: require('../package.json')
}