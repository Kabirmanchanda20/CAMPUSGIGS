import { io, type Socket } from 'socket.io-client'
import { env } from './env'
import { tokenStore } from '../auth/tokenStore'

let socketInstance: Socket | null = null

export function getSocket(): Socket {
  if (!socketInstance) {
    const url = env?.apiBaseUrl || 'http://localhost:5000'

    socketInstance = io(url, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: (cb) => {
        const token = tokenStore.get()
        cb({ token })
      },
    })

    socketInstance.on('connect_error', (err) => {
      // In development or when unauthenticated, log quietly
      console.warn('[WebSocket] Connection warning:', err.message)
    })
  }

  return socketInstance
}

export function connectSocket(): Socket {
  const socket = getSocket()
  if (!socket.connected) {
    socket.connect()
  }
  return socket
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
  }
}
