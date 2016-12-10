'use strict';

// Load Modules

const Joi = require('joi');
const Hoek = require('hoek');

// Declare internals

const internals = {};

exports.action = function (options, message) {

    const result = Joi.validate(options, internals.action);
    Hoek.assert(!result.error, message);
    return result.value;
};

internals.action =  Joi.object({
    cache: Joi.object(),
    generateKey: Joi.func()
});