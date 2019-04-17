'use strict'

const Code = require('code')
const Hapi = require('hapi')
const HapiHemera = require('../')

const { expect } = Code

describe('Base Pattern', function() {
  const noAuthUrl = process.env.NATS_URL || `nats://localhost:4222`

  it('Should be able to create base pattern with function', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        basePattern() {
          const basePattern = {
            a: 1
          }
          return basePattern
        },
        hemera: {
          logLevel: 'silent'
        },
        nats: {
          url: noAuthUrl
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/api/add',
      handler(request) {
        return request.hemera.pattern({ b: 2 })
      }
    })

    const resp = await server.inject({ method: 'GET', url: '/api/add' })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal({ a: 1, b: 2 })

    await server.stop()
  })

  it('Should be able to create base pattern with object', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        basePattern: {
          a: 1
        },
        hemera: {
          logLevel: 'silent'
        },
        nats: {
          url: noAuthUrl
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/api/add',
      handler(request) {
        return request.hemera.pattern({ b: 2 })
      }
    })

    const resp = await server.inject({ method: 'GET', url: '/api/add' })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal({ a: 1, b: 2 })

    await server.stop()
  })

  it('Should include base pattern when we act', async () => {
    const server = new Hapi.Server()
    await server.register({
      plugin: HapiHemera,
      options: {
        basePattern: {
          a: 1,
          b: 2
        },
        hemera: {
          logLevel: 'silent'
        },
        nats: {
          url: noAuthUrl
        }
      }
    })

    server.hemera.add(
      {
        topic: 'math',
        cmd: 'add'
      },
      async req => req.a + req.b
    )

    server.route({
      method: 'GET',
      path: '/api/add',
      handler(request) {
        return request.hemera.act({
          topic: 'math',
          cmd: 'add'
        })
      }
    })

    const resp = await server.inject({ method: 'GET', url: '/api/add' })

    expect(resp.statusCode).to.equal(200)
    expect(resp.result).to.equal(3)

    await server.stop()
  })
})
