'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/providers/SocketProvider'
import { apiPost } from '@/lib/api'
import Link from 'next/link'

type Message = {
  id: string
  discussionId: string
  authorId: string
  authorRole: 'ADVISOR' | 'CLIENT'
  content: string
  createdAt: string
}

export default function AdvisorPage() {
  const { socket, ready } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])

  const discussionId = 'conv-test-1'

  useEffect(() => {
    if (!ready || !socket) return

    const onConnect = () => {
      console.log('WS connected', socket.id)
    }

    const onDisconnect = () => {
      console.log('WS disconnected')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [ready, socket])

  useEffect(() => {
    if (!ready || !socket) return

    socket.emit('discussion.join', { discussionId })
  }, [ready, socket, discussionId])

  useEffect(() => {
    if (!ready || !socket) return

    const handler = (message: Message) => {
      setMessages((prev) => [...prev, message])
    }

    socket.on('discussion.newMessage', (payload: { discussionId: string; message: Message }) => {
      if (payload.discussionId !== discussionId) return
      handler(payload.message)
    })

    return () => {
      socket.off('discussion.newMessage')
    }
  }, [ready, socket])

  useEffect(() => {
    if (!ready || !socket) return
  
    socket.on('connect_error', (err) => {
      console.error('WS connect_error', err.message)
    })
  }, [ready, socket])
  

  if (!ready) {
    return <div>Connexion en cours…</div>
  }
  

  return (
    <div>
      <h1>Advisor dashboard</h1>
      <Link href="/advisor/inbox">Voir les demandes clients</Link>

      <button
        onClick={() =>
          apiPost(`/chat/discussion/${discussionId}/message`, {
            content: 'Hello from advisor',
          }).catch(console.error)
        }
      >
        Send test message
      </button>

      <ul>
        {messages.map((m) => (
          <li key={m.id}>
            <strong>{m.authorRole}</strong>: {m.content}
          </li>
        ))}
      </ul>
    </div>
  )
}
