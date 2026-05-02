import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { BASE_URL, getStoredToken } from '../lib/api/interaction'

type WsEvent = {
  type: 'message.created' | 'analysis.completed' | 'evidence.created'
  channel_id?: number
  [key: string]: unknown
}

const WS_BASE = BASE_URL.replace(/^http/, 'ws')
const MAX_RETRIES = 5

export function useInteractionSocket(channelId: number | null) {
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const activeRef = useRef(true)

  useEffect(() => {
    if (channelId === null) return

    activeRef.current = true
    retriesRef.current = 0

    function connect() {
      const token = getStoredToken()
      if (!token) return

      const ws = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(token)}`)
      wsRef.current = ws

      ws.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data as string) as WsEvent
          if (event.type === 'message.created' || event.type === 'evidence.created') {
            queryClient.invalidateQueries({
              queryKey: ['interaction-messages', channelId],
            })
          }
          if (event.type === 'analysis.completed') {
            queryClient.invalidateQueries({
              queryKey: ['interaction-analysis', channelId],
            })
            queryClient.invalidateQueries({ queryKey: ['interaction-ranking'] })
          }
        } catch {
          // non-JSON frames ignored
        }
      }

      ws.onclose = (ev) => {
        if (!activeRef.current) return
        if (ev.code === 4001) return // auth failure — do not retry
        if (retriesRef.current >= MAX_RETRIES) return
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30_000)
        retriesRef.current += 1
        setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      activeRef.current = false
      wsRef.current?.close()
    }
  }, [channelId, queryClient])
}
