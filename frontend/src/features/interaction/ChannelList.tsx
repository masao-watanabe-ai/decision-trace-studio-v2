import { useChannels } from '../../hooks/useInteraction'
import { useStudioStore } from '../../store/studioStore'

export function ChannelList() {
  const { data: channels, isLoading, isError } = useChannels()
  const { activeChannelId, setActiveChannelId } = useStudioStore()

  return (
    <div className="flex h-full w-48 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
      <div className="shrink-0 border-b border-gray-200 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Channels
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {isLoading && (
          <p className="px-3 py-2 text-xs text-gray-400">読み込み中...</p>
        )}
        {isError && (
          <p className="px-3 py-2 text-xs text-red-400">
            接続できません
          </p>
        )}
        {channels?.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setActiveChannelId(ch.id)}
            className={`w-full px-3 py-2 text-left text-xs transition-colors ${
              activeChannelId === ch.id
                ? 'bg-blue-50 font-medium text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            # {ch.name}
          </button>
        ))}
        {!isLoading && !isError && channels?.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">チャンネルなし</p>
        )}
      </div>
    </div>
  )
}
