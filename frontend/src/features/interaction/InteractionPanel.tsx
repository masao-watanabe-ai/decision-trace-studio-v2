import { useEffect } from 'react'
import { useMessages } from '../../hooks/useInteraction'
import { devLogin, getStoredToken } from '../../lib/api/interaction'
import { useInteractionSocket } from '../../hooks/useInteractionSocket'
import { useStudioStore } from '../../store/studioStore'
import { ChannelList } from './ChannelList'
import { MessageInput } from './MessageInput'
import { MessageThread } from './MessageThread'
import { SignalPanel } from './SignalPanel'
import { useChannels } from '../../hooks/useInteraction'

export function InteractionPanel({ projectId }: { projectId: string }) {
  const { activeChannelId } = useStudioStore()

  // Ensure dev auth token is present on mount
  useEffect(() => {
    if (!getStoredToken()) {
      devLogin(1)
    }
  }, [])

  // Mount WebSocket for active channel
  useInteractionSocket(activeChannelId)

  const { data: channels } = useChannels()
  const { data: messages = [] } = useMessages(activeChannelId)

  const activeChannel = channels?.find((c) => c.id === activeChannelId) ?? null

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Channel list */}
      <ChannelList />

      {/* Center: Message thread + input */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Channel header */}
        <div className="shrink-0 border-b border-gray-200 px-4 py-2">
          {activeChannel ? (
            <p className="text-xs font-medium text-gray-800"># {activeChannel.name}</p>
          ) : (
            <p className="text-xs text-gray-400">チャンネルを選択してください</p>
          )}
        </div>

        {activeChannelId === null ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-gray-400">左のリストからチャンネルを選んでください</p>
          </div>
        ) : (
          <>
            <MessageThread messages={messages} />
            <MessageInput channelId={activeChannelId} />
          </>
        )}
      </div>

      {/* Right: Signal panel */}
      <SignalPanel
        channelId={activeChannelId}
        channelName={activeChannel?.name ?? ''}
        projectId={projectId}
      />
    </div>
  )
}
