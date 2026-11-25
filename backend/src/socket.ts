import type { Server as HttpServer } from 'node:http'
import { Server as SocketIOServer, type Socket } from 'socket.io'
import { env } from './config/env.js'
import { query } from './config/db.js'
import { verifyAccessToken } from './utils/jwt.js'

interface SocketUser {
  id: string
  fullName: string
}

let ioInstance: SocketIOServer | null = null

export function initSocket(httpServer: HttpServer): SocketIOServer {
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim())

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  })

  // JWT Authentication Middleware for Socket Handshake
  io.use(async (socket: Socket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined)

      if (!token) {
        return next(new Error('Authentication required: Token missing'))
      }

      const payload = verifyAccessToken(token)
      const { rows } = await query<{ id: string; full_name: string; is_suspended: boolean }>(
        `select id, full_name, is_suspended from profiles where id = $1`,
        [payload.sub],
      )

      const user = rows[0]
      if (!user) {
        return next(new Error('Authentication failed: User not found'))
      }
      if (user.is_suspended) {
        return next(new Error('Account suspended'))
      }

      socket.data.user = {
        id: user.id,
        fullName: user.full_name,
      } as SocketUser

      next()
    } catch {
      return next(new Error('Authentication failed: Invalid or expired token'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser
    if (!user) return

    // Personal user room for direct alerts
    socket.join(`user:${user.id}`)

    // Join task conversation room (verifies membership)
    socket.on('task:join', async (taskId: string, callback?: (res: { success: boolean; error?: string }) => void) => {
      try {
        if (!taskId) {
          callback?.({ success: false, error: 'taskId required' })
          return
        }

        const { rows } = await query<{ poster_id: string; worker_id: string }>(
          `select poster_id, worker_id from tasks where id = $1`,
          [taskId],
        )

        const task = rows[0]
        if (!task) {
          callback?.({ success: false, error: 'Task not found' })
          return
        }

        if (task.poster_id !== user.id && task.worker_id !== user.id) {
          callback?.({ success: false, error: 'Access denied: Participants only' })
          return
        }

        socket.join(`task:${taskId}`)
        callback?.({ success: true })
      } catch {
        callback?.({ success: false, error: 'Internal error joining room' })
      }
    })

    // Leave task room
    socket.on('task:leave', (taskId: string) => {
      if (taskId) socket.leave(`task:${taskId}`)
    })

    // Live typing indicator
    socket.on('typing:start', (taskId: string) => {
      if (!taskId) return
      socket.to(`task:${taskId}`).emit('typing:status', {
        taskId,
        userId: user.id,
        fullName: user.fullName,
        isTyping: true,
      })
    })

    socket.on('typing:stop', (taskId: string) => {
      if (!taskId) return
      socket.to(`task:${taskId}`).emit('typing:status', {
        taskId,
        userId: user.id,
        fullName: user.fullName,
        isTyping: false,
      })
    })

    socket.on('disconnect', () => {
      // Socket.IO automatically leaves rooms on disconnect
    })
  })

  ioInstance = io
  return io
}

export function getIO(): SocketIOServer | null {
  return ioInstance
}
