import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api/client'
import { connectSocket, getSocket } from '../../lib/socket'
import type { Message } from '../../types/database'

export function useTaskMessages(taskId?: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!taskId) return

    const socket = connectSocket()

    // Join the secure room for this task
    socket.emit('task:join', taskId)

    // Listen for incoming instant messages
    const handleNewMessage = (newMsg: Message) => {
      if (newMsg.task_id === taskId) {
        qc.setQueryData<Message[]>(['messages', taskId], (old) => {
          if (!old) return [newMsg]
          if (old.some((m) => m.id === newMsg.id)) return old
          return [...old, newMsg]
        })
        void qc.invalidateQueries({ queryKey: ['inbox'] })
      }
    }

    socket.on('message:new', handleNewMessage)

    return () => {
      socket.emit('task:leave', taskId)
      socket.off('message:new', handleNewMessage)
    }
  }, [taskId, qc])

  return useQuery({
    queryKey: ['messages', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data } = await api.get(`/messages/task/${taskId}`)
      return data.data as Message[]
    },
    // Slower fallback heartbeat in case socket momentarily reconnects
    refetchInterval: 10_000,
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { task_id: string; sender_id: string; content: string }) => {
      const { data } = await api.post('/messages', {
        task_id: input.task_id,
        content: input.content,
      })
      return data.data as Message
    },
    onSuccess: (newMsg, vars) => {
      qc.setQueryData<Message[]>(['messages', vars.task_id], (old) => {
        if (!old) return [newMsg]
        if (old.some((m) => m.id === newMsg.id)) return old
        return [...old, newMsg]
      })
      void qc.invalidateQueries({ queryKey: ['inbox'] })
    },
  })
}

export function useInbox() {
  const qc = useQueryClient()

  useEffect(() => {
    const socket = connectSocket()
    const handleNewMessage = () => {
      void qc.invalidateQueries({ queryKey: ['inbox'] })
    }
    socket.on('message:new', handleNewMessage)
    return () => {
      socket.off('message:new', handleNewMessage)
    }
  }, [qc])

  return useQuery({
    queryKey: ['inbox'],
    queryFn: async () => {
      const { data } = await api.get('/messages/inbox')
      return data.data as Array<{
        task_id: string
        title: string
        status: string
        last_message: string
        last_at: string
      }>
    },
    refetchInterval: 10_000,
  })
}

export function useTypingIndicator(taskId?: string) {
  const [typingUser, setTypingUser] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) return
    const socket = connectSocket()
    let timer: ReturnType<typeof setTimeout> | null = null

    const handleTypingStatus = (data: {
      taskId: string
      userId: string
      fullName: string
      isTyping: boolean
    }) => {
      if (data.taskId === taskId) {
        if (data.isTyping) {
          setTypingUser(data.fullName)
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => setTypingUser(null), 3000)
        } else {
          setTypingUser(null)
        }
      }
    }

    socket.on('typing:status', handleTypingStatus)
    return () => {
      socket.off('typing:status', handleTypingStatus)
      if (timer) clearTimeout(timer)
    }
  }, [taskId])

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!taskId) return
      const socket = getSocket()
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', taskId)
    },
    [taskId],
  )

  return { typingUser, sendTyping }
}

export function useSocketStatus() {
  const [isConnected, setIsConnected] = useState(() => getSocket().connected)

  useEffect(() => {
    const socket = connectSocket()

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return isConnected
}
