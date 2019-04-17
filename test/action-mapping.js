'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')

const { expect } = Code

describe('Action Mapping', function() {
  const noAuthUrl = process.env.NATS_URL || `nats://localhost:4222`

  it('Maps an action to a server method', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        hemera: {
          logLevel: 'silent'
        },
        nats: {
          url: noAuthUrl
        }
      }
    })

    let id = 0
    server.hemera.add(
      {
        topic: 'generator',
        cmd: 'id'
      },
      (message, next) => {
        return next(null, {
          id: ++id
        })
      }
    )

    server.action('generate', 'topic:generator,cmd:id')

    const result = await server.methods.generate()

    expect(result).to.equal({
      id: 1
    })

    await server.stop()
  })

  it('Maps an action to a server method (object pattern)', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        hemera: {
          logLevel: 'silent'
        },
        nats: {
          url: noAuthUrl
        }
      }
    })

    let id = 0
    server.hemera.add(
      {
        topic: 'generator',
        cmd: 'id'
      },
      (message, next) => {
        return next(null, {
          id: ++id
        })
      }
    )

    server.action('generate', {
      topic: 'generator',
      cmd: 'id'
    })

    const result = await server.methods.generate()

    expect(result).to.equal({
      id: 1
    })

    await server.stop()
  })
})
