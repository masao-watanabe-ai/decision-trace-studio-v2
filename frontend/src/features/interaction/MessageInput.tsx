import { useState } from 'react'
import { useSendMessage } from '../../hooks/useInteraction'

export function MessageInput({ channelId }: { channelId: number | null }) {
  const [text, setText] = useState('')
  const { mutate: send, isPending } = useSendMessage(channelId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || channelId === null) return
    send(trimmed, {
      onSuccess: () => setText(''),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 border-t border-gray-200 bg-white px-4 py-3"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={channelId === null || isPending}
          placeholder={channelId === null ? 'チャンネルを選択してください' : 'メッセージを入力...'}
          className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-xs placeholder-gray-400 focus:border-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={!text.trim() || channelId === null || isPending}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          送信
        </button>
      </div>
    </form>
  )
}
