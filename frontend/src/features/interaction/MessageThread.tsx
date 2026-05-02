import { useEffect, useRef } from 'react'
import type { IMessage } from '../../lib/api/interaction'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

export function MessageThread({ messages }: { messages: IMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-xs text-gray-400">まだメッセージがありません</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      {messages.map((msg) => (
        <div key={msg.id} className="flex gap-2">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">
            {msg.user_id}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-gray-700">User {msg.user_id}</span>
              <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
            </div>
            <p className="mt-0.5 text-xs text-gray-800 leading-relaxed">{msg.content}</p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
