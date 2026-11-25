import http from 'node:http'
import { describe, expect, it, afterAll, beforeAll } from 'vitest'
import { io as Client, type Socket as ClientSocket } from 'socket.io-client'
import { initSocket, getIO } from '../socket.js'

describe('WebSocket Server & Handshake Security', () => {
  let server: http.Server
  let port: number

  beforeAll(async () => {
    server = http.createServer()
    initSocket(server)
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address()
        if (addr && typeof addr === 'object') {
          port = addr.port
        }
        resolve()
      })
    })
  })

  afterAll(async () => {
    const io = getIO()
    if (io) {
      await new Promise<void>((resolve) => io.close(() => resolve()))
    }
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it('exposes initialized Socket.IO instance via getIO()', () => {
    const io = getIO()
    expect(io).toBeDefined()
  })

  it('rejects connection without authentication token', async () => {
    const client: ClientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      autoConnect: false,
    })

    const errorPromise = new Promise<string>((resolve) => {
      client.on('connect_error', (err) => {
        resolve(err.message)
      })
    })

    client.connect()
    const errMsg = await errorPromise
    expect(errMsg).toMatch(/Authentication required|Token missing/i)
    client.disconnect()
  })

  it('rejects connection with invalid or malformed JWT token', async () => {
    const client: ClientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: 'invalid.bogus.jwt.token' },
      autoConnect: false,
    })

    const errorPromise = new Promise<string>((resolve) => {
      client.on('connect_error', (err) => {
        resolve(err.message)
      })
    })

    client.connect()
    const errMsg = await errorPromise
    expect(errMsg).toMatch(/Authentication failed/i)
    client.disconnect()
  })
})
