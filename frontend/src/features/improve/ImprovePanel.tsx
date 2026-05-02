import { useState } from 'react'
import {
  useAcceptSuggestion,
  useCreateSuggestionFromContext,
  useGenerateSuggestions,
  useRejectSuggestion,
  useSuggestions,
} from '../../hooks/useSuggestions'
import {
  useGenerateScenarios,
  useRunSimulation,
} from '../../hooks/useSimulation'
import { useDecisionOperation } from '../../hooks/useDecisionOperation'
import type { Suggestion, SuggestionType } from '../../lib/api/suggestions'
import { useStudioStore } from '../../store/studioStore'
import type { DecisionContext } from '../../types/interaction'

// ── NodeProposalCard ──────────────────────────────────────────────────────────

type NodeProposal = {
  type: 'Decision'
  name: string
  condition: string
  action: string
  description: string
}

function NodeProposalCard({
  initial,
  projectId,
  onCreated,
}: {
  initial: NodeProposal
  projectId: string
  onCreated: (applied: boolean) => void
}) {
  const [name, setName] = useState(initial.name)
  const [condition, setCondition] = useState(initial.condition)
  const [action, setAction] = useState(initial.action)

  // Phase 1: auto-apply toggle
  const [autoApply, setAutoApply] = useState(false)
  // Phase 2: auto-simulate toggle (only meaningful when autoApply is true)
  const [autoSimulate, setAutoSimulate] = useState(false)

  const { mutate: createFromContext, isPending: isCreating } = useCreateSuggestionFromContext(projectId)
  const { mutate: acceptSugg, isPending: isAccepting } = useAcceptSuggestion(projectId)
  const { mutate: genScenarios, isPending: isGenerating } = useGenerateScenarios(projectId)
  const { mutate: runSim, isPending: isRunning } = useRunSimulation(projectId)

  const isWorking = isCreating || isAccepting || isGenerating || isRunning

  function statusLabel(): string {
    if (isRunning) return 'シミュレーション実行中...'
    if (isGenerating) return 'シナリオ生成中...'
    if (isAccepting) return 'フローに反映中...'
    if (isCreating) return '作成中...'
    return 'Create Suggestion'
  }

  function handleCreate() {
    createFromContext(
      {
        intent: name,
        if_condition: condition,
        then_adjustment: action,
        because_reason: initial.description,
      },
      {
        onSuccess: (suggestion) => {
          if (autoApply) {
            acceptSugg(suggestion.id, {
              onSuccess: () => {
                if (autoSimulate) {
                  genScenarios(undefined, {
                    onSuccess: (scenarios) => {
                      runSim(scenarios, {
                        onSuccess: () => onCreated(true),
                      })
                    },
                  })
                } else {
                  onCreated(true)
                }
              },
            })
          } else {
            onCreated(false)
          }
        },
      },
    )
  }

  return (
    <div className="mt-3 rounded border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          Decision Node
        </span>
        <span className="text-[10px] text-gray-400">提案内容を確認・編集してから追加してください</span>
      </div>

      <div className="space-y-2 font-mono text-[11px]">
        {/* type — fixed */}
        <div className="flex items-center gap-2">
          <span className="w-20 shrink-0 text-gray-400">type</span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">{initial.type}</span>
        </div>

        {/* name — editable */}
        <div className="flex items-start gap-2">
          <span className="mt-1.5 w-20 shrink-0 text-gray-400">name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 focus:border-blue-300 focus:bg-white focus:outline-none"
          />
        </div>

        {/* condition — editable */}
        <div className="flex items-start gap-2">
          <span className="mt-1.5 w-20 shrink-0 text-gray-400">condition</span>
          <input
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="例: vip == True and status == 'complaint'"
            className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 placeholder-gray-300 focus:border-blue-300 focus:bg-white focus:outline-none"
          />
        </div>

        {/* action — editable */}
        <div className="flex items-start gap-2">
          <span className="mt-1.5 w-20 shrink-0 text-gray-400">action</span>
          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="例: human_review, escalate_legal"
            className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 placeholder-gray-300 focus:border-blue-300 focus:bg-white focus:outline-none"
          />
        </div>

        {/* description — read-only */}
        <div className="flex items-start gap-2">
          <span className="mt-1.5 w-20 shrink-0 text-gray-400">description</span>
          <span className="flex-1 break-words text-gray-500">{initial.description}</span>
        </div>
      </div>

      {/* Phase 1 + 2: optional automation toggles */}
      <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-gray-600">
          <input
            type="checkbox"
            checked={autoApply}
            onChange={(e) => {
              setAutoApply(e.target.checked)
              if (!e.target.checked) setAutoSimulate(false)
            }}
            className="h-3 w-3 accent-blue-600"
          />
          Auto apply after creation
        </label>
        <label className={`flex cursor-pointer items-center gap-2 text-[11px] ${autoApply ? 'text-gray-600' : 'text-gray-300'}`}>
          <input
            type="checkbox"
            checked={autoSimulate}
            onChange={(e) => setAutoSimulate(e.target.checked)}
            disabled={!autoApply}
            className="h-3 w-3 accent-blue-600"
          />
          Auto run simulation after apply
        </label>
      </div>

      <button
        onClick={handleCreate}
        disabled={isWorking || !name.trim() || !condition.trim() || !action.trim()}
        className="mt-3 w-full rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
      >
        {statusLabel()}
      </button>
    </div>
  )
}

// ── DecisionContextCard ───────────────────────────────────────────────────────

function DecisionContextCard({
  ctx,
  projectId,
  onUse,
  onDismiss,
  onNodeCreated,
  isPending,
}: {
  ctx: DecisionContext
  projectId: string
  onUse: () => void
  onDismiss: () => void
  onNodeCreated?: (applied: boolean) => void
  isPending: boolean
}) {
  const [signalsOpen, setSignalsOpen] = useState(false)
  const [nodeProposal, setNodeProposal] = useState<NodeProposal | null>(null)
  const [opAutoApply, setOpAutoApply] = useState(false)
  const [opAutoSimulate, setOpAutoSimulate] = useState(false)
  const { mutate: runDecOp, isPending: isRunningOp, data: opResult } = useDecisionOperation(projectId)

  function handleConvertToNode() {
    setNodeProposal({
      type: 'Decision',
      name: ctx.intent.slice(0, 40),
      condition: ctx.hypothesis.if_condition,
      action: ctx.hypothesis.then_adjustment,
      description: ctx.hypothesis.because_reason,
    })
  }

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              From Interaction Core
            </span>
            <span className="text-[10px] text-gray-500">#{ctx.channel_name}</span>
          </div>
          <p className="mt-1 text-xs font-medium text-gray-800">{ctx.intent}</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Hypothesis block */}
      <div className="mb-3 rounded border border-blue-100 bg-white px-3 py-2 font-mono text-[11px] leading-relaxed text-gray-700 space-y-0.5">
        <div>
          <span className="font-bold text-gray-400">IF{'      '}</span>
          {ctx.hypothesis.if_condition}
        </div>
        <div>
          <span className="font-bold text-gray-400">THEN{'    '}</span>
          {ctx.hypothesis.then_adjustment}
        </div>
        <div>
          <span className="font-bold text-gray-400">BECAUSE </span>
          {ctx.hypothesis.because_reason}
        </div>
      </div>

      {/* Signals collapsible */}
      <button
        onClick={() => setSignalsOpen((o) => !o)}
        className="mb-2 text-[10px] text-blue-500 hover:text-blue-700"
      >
        Signals ({ctx.signals.length}) {signalsOpen ? '▲' : '▼'}
      </button>

      {signalsOpen && (
        <ul className="mb-3 space-y-0.5">
          {ctx.signals.map((s) => (
            <li key={s.id} className="flex items-start gap-1.5 text-[10px] text-gray-600">
              <span className="mt-0.5 rounded bg-gray-100 px-1 text-[9px] text-gray-400">
                {s.tags[0] ?? s.source_type}
              </span>
              <span>{s.content}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Node proposal (shown after Convert is clicked) */}
      {nodeProposal && (
        <NodeProposalCard
          initial={nodeProposal}
          projectId={projectId}
          onCreated={(applied) => {
            setNodeProposal(null)
            onNodeCreated?.(applied)
          }}
        />
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={handleConvertToNode}
          disabled={!!nodeProposal}
          className="rounded border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-40"
        >
          Convert to Decision Node
        </button>
        <button
          onClick={onUse}
          disabled={isPending}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {isPending ? '生成中...' : 'Generate Suggestion from Context'}
        </button>
      </div>

      {/* Decision Operation shortcut */}
      <div className="mt-3 rounded border border-indigo-100 bg-indigo-50 px-3 py-2.5 space-y-2">
        <p className="text-[10px] font-semibold text-indigo-600">Run Decision Operation</p>
        <div className="space-y-1">
          <label className="flex cursor-pointer items-center gap-2 text-[10px] text-gray-600">
            <input
              type="checkbox"
              checked={opAutoApply}
              onChange={(e) => {
                setOpAutoApply(e.target.checked)
                if (!e.target.checked) setOpAutoSimulate(false)
              }}
              className="h-3 w-3 accent-indigo-600"
            />
            Auto apply after creation
          </label>
          <label className={`flex cursor-pointer items-center gap-2 text-[10px] ${opAutoApply ? 'text-gray-600' : 'text-gray-300'}`}>
            <input
              type="checkbox"
              checked={opAutoSimulate}
              onChange={(e) => setOpAutoSimulate(e.target.checked)}
              disabled={!opAutoApply}
              className="h-3 w-3 accent-indigo-600"
            />
            Auto run simulation after apply
          </label>
        </div>
        {opResult && (
          <div className="rounded bg-green-50 px-2 py-1 text-[10px] text-green-700">
            {opResult.applied ? '✓ フローに反映済み' : '✓ Suggestion 作成済み'}
            {opResult.simulation_run && ' · シミュレーション完了'}
          </div>
        )}
        <button
          onClick={() => runDecOp({
            intent: ctx.intent,
            if_condition: ctx.hypothesis.if_condition,
            then_adjustment: ctx.hypothesis.then_adjustment,
            because_reason: ctx.hypothesis.because_reason,
            auto_apply: opAutoApply,
            auto_simulate: opAutoSimulate,
          }, {
            onSuccess: (result) => {
              if (result.applied) onNodeCreated?.(true)
            },
          })}
          disabled={isRunningOp}
          className="w-full rounded bg-indigo-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {isRunningOp ? '実行中...' : 'Run Decision Operation'}
        </button>
      </div>
    </div>
  )
}

// ── ComparePromptBanner ───────────────────────────────────────────────────────

function ComparePromptBanner({
  onGoToSimulate,
  onGoToCompare,
  onDismiss,
}: {
  onGoToSimulate: () => void
  onGoToCompare: () => void
  onDismiss: () => void
}) {
  return (
    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <p className="text-xs font-medium text-green-800">
            Decision Node がフローに追加されました
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <ol className="mb-3 space-y-1 pl-1">
        <li className="flex items-center gap-2 text-xs text-green-700">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-200 text-[9px] font-bold text-green-700">
            1
          </span>
          Simulate タブでシナリオを再実行する
        </li>
        <li className="flex items-center gap-2 text-xs text-green-700">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-200 text-[9px] font-bold text-green-700">
            2
          </span>
          Compare タブで変更前後の差分を確認する
        </li>
      </ol>

      <div className="flex gap-2">
        <button
          onClick={() => { onGoToSimulate(); onDismiss() }}
          className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          Go to Simulate →
        </button>
        <button
          onClick={() => { onGoToCompare(); onDismiss() }}
          className="rounded border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
        >
          Go to Compare →
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<SuggestionType, string> = {
  boundary_add: '境界追加',
  condition_split: '条件分割',
  priority_adjust: '優先度調整',
  context_node_add: 'コンテキストノード追加',
}

const TYPE_COLORS: Record<SuggestionType, string> = {
  boundary_add: 'bg-purple-100 text-purple-700',
  condition_split: 'bg-orange-100 text-orange-700',
  priority_adjust: 'bg-blue-100 text-blue-700',
  context_node_add: 'bg-blue-100 text-blue-700',
}

const FLOW_APPLICABLE: SuggestionType[] = ['boundary_add', 'priority_adjust', 'context_node_add']

function SuggestionCard({
  suggestion,
  onAccept,
  onReject,
  isPending,
}: {
  suggestion: Suggestion
  onAccept: (id: string) => void
  onReject: (id: string) => void
  isPending: boolean
}) {
  const isActionable = suggestion.status === 'pending'

  return (
    <div
      className={`rounded-lg border p-4 ${
        suggestion.status === 'accepted'
          ? 'border-green-200 bg-green-50'
          : suggestion.status === 'rejected'
            ? 'border-gray-200 bg-gray-50 opacity-60'
            : 'border-gray-200 bg-white'
      }`}
    >
      {/* header row */}
      <div className="mb-2 flex flex-wrap items-start gap-2">
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[suggestion.type]}`}
        >
          {TYPE_LABELS[suggestion.type]}
        </span>

        {suggestion.status === 'accepted' && (
          <span className="text-xs font-medium text-green-600">承認済み</span>
        )}
        {suggestion.status === 'rejected' && (
          <span className="text-xs font-medium text-gray-400">却下済み</span>
        )}

        {suggestion.applied_to_flow && (
          <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
            Flow に反映済み
          </span>
        )}

        {suggestion.status === 'accepted' &&
          !suggestion.applied_to_flow &&
          FLOW_APPLICABLE.includes(suggestion.type) && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Flow 未反映
            </span>
          )}
      </div>

      {suggestion.target_node_id && (
        <p className="mb-1 font-mono text-xs text-gray-400">
          対象ノード: {suggestion.target_node_id}
        </p>
      )}

      <p className="mb-1 text-xs text-gray-700">{suggestion.reason}</p>
      <p className="mb-3 text-xs text-gray-500">{suggestion.impact}</p>

      {(suggestion.proposed_node_type ||
        suggestion.proposed_condition ||
        suggestion.proposed_action ||
        suggestion.proposed_priority !== null) && (
        <div className="mb-3 space-y-0.5 rounded bg-gray-100 px-3 py-2 text-xs">
          {suggestion.proposed_node_type && (
            <div>
              <span className="font-medium text-gray-600">node type: </span>
              <span className="font-mono text-gray-700">{suggestion.proposed_node_type}</span>
            </div>
          )}
          {suggestion.proposed_condition && (
            <div>
              <span className="font-medium text-gray-600">condition: </span>
              <span className="font-mono text-gray-700">{suggestion.proposed_condition}</span>
            </div>
          )}
          {suggestion.proposed_action && (
            <div>
              <span className="font-medium text-gray-600">action: </span>
              <span className="font-mono text-gray-700">{suggestion.proposed_action}</span>
            </div>
          )}
          {suggestion.proposed_priority !== null && (
            <div>
              <span className="font-medium text-gray-600">priority: </span>
              <span className="font-mono text-gray-700">{suggestion.proposed_priority}</span>
            </div>
          )}
        </div>
      )}

      {isActionable && (
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(suggestion.id)}
            disabled={isPending}
            className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-40"
          >
            {FLOW_APPLICABLE.includes(suggestion.type) ? '承認 & Flow 反映' : '承認'}
          </button>
          <button
            onClick={() => onReject(suggestion.id)}
            disabled={isPending}
            className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
          >
            却下
          </button>
        </div>
      )}
    </div>
  )
}

export function ImprovePanel({
  projectId,
  onGoToSimulate,
  onGoToCompare,
}: {
  projectId: string
  onGoToSimulate?: () => void
  onGoToCompare?: () => void
}) {
  const { data: suggestions, isLoading } = useSuggestions(projectId)
  const { mutate: generate, isPending: isGenerating } = useGenerateSuggestions(projectId)
  const { mutate: accept, isPending: isAccepting } = useAcceptSuggestion(projectId)
  const { mutate: reject, isPending: isRejecting } = useRejectSuggestion(projectId)
  const { decisionContext, clearDecisionContext } = useStudioStore()
  const [comparePromptVisible, setComparePromptVisible] = useState(false)

  const isActing = isAccepting || isRejecting

  const pending = suggestions?.filter((s) => s.status === 'pending') ?? []
  const resolved = suggestions?.filter((s) => s.status !== 'pending') ?? []

  function handleAccept(suggestionId: string) {
    const s = suggestions?.find((s) => s.id === suggestionId)
    accept(suggestionId, {
      onSuccess: () => {
        if (s?.type === 'context_node_add') {
          setComparePromptVisible(true)
        }
      },
    })
  }

  function handleGenerateFromContext(ctx: DecisionContext) {
    generate({
      intent: ctx.intent,
      if_condition: ctx.hypothesis.if_condition,
      then_adjustment: ctx.hypothesis.then_adjustment,
      because_reason: ctx.hypothesis.because_reason,
      signals: ctx.signals.map((s) => ({
        content: s.content,
        tags: s.tags,
        score: s.score,
      })),
    })
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Decision Context Card — shown when a proposal has been sent from Interact tab */}
      {decisionContext && (
        <DecisionContextCard
          ctx={decisionContext}
          projectId={projectId}
          onUse={() => handleGenerateFromContext(decisionContext)}
          onDismiss={clearDecisionContext}
          onNodeCreated={(applied) => { if (applied) setComparePromptVisible(true) }}
          isPending={isGenerating}
        />
      )}

      {/* Compare prompt — shown after a context_node_add suggestion is accepted */}
      {comparePromptVisible && onGoToSimulate && onGoToCompare && (
        <ComparePromptBanner
          onGoToSimulate={onGoToSimulate}
          onGoToCompare={onGoToCompare}
          onDismiss={() => setComparePromptVisible(false)}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Improve</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            シミュレーション結果からルール改善の提案を生成します。承認すると Flow に即反映されます。
          </p>
        </div>
        <button
          onClick={() => generate(undefined)}
          disabled={isGenerating}
          className="rounded bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {isGenerating ? '分析中...' : '提案を生成'}
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">読み込み中...</p>}

      {!isLoading && (!suggestions || suggestions.length === 0) && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-400">
            まず「提案を生成」をクリックしてください。
            <br />
            シミュレーションを実行済みの場合、改善提案が表示されます。
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            未対応 ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={handleAccept}
                onReject={reject}
                isPending={isActing}
              />
            ))}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            対応済み ({resolved.length})
          </h3>
          <div className="space-y-3">
            {resolved.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={handleAccept}
                onReject={reject}
                isPending={isActing}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
