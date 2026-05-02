import { useEffect, useState } from 'react'
import {
  useAnalysisSummary,
  useGenerateHypothesis,
  useRanking,
  useTriggerAnalysis,
} from '../../hooks/useInteraction'
import { useDecisionOperation } from '../../hooks/useDecisionOperation'
import type { IAnalysisSummary } from '../../lib/api/interaction'
import { useStudioStore } from '../../store/studioStore'
import type { Signal } from '../../types/interaction'

// ── Signal derivation ─────────────────────────────────────────────────────────

function deriveSignals(summary: IAnalysisSummary): Signal[] {
  const signals: Signal[] = []

  summary.top_keywords.slice(0, 5).forEach((kw, i) => {
    signals.push({
      id: `kw-${i}`,
      source_type: 'analysis',
      source_id: summary.channel_id,
      content: kw,
      tags: ['keyword'],
      score: null,
      selected: false,
    })
  })

  summary.insights.forEach((insight, i) => {
    signals.push({
      id: `insight-${i}`,
      source_type: 'analysis',
      source_id: summary.channel_id,
      content: insight,
      tags: ['insight'],
      score: null,
      selected: false,
    })
  })

  summary.suggested_actions.forEach((action, i) => {
    signals.push({
      id: `action-${i}`,
      source_type: 'analysis',
      source_id: summary.channel_id,
      content: action,
      tags: ['suggested_action'],
      score: null,
      selected: false,
    })
  })

  return signals
}

// ── Tag badge ─────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  keyword: 'bg-blue-100 text-blue-600',
  insight: 'bg-purple-100 text-purple-600',
  suggested_action: 'bg-green-100 text-green-600',
}

function TagBadge({ tag }: { tag: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-500'}`}>
      {tag}
    </span>
  )
}

// ── Hypothesis row ────────────────────────────────────────────────────────────

function HypothesisRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 w-16 shrink-0 font-mono text-[10px] font-bold text-gray-400">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? '— Generate を押してください' : ''}
        className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 placeholder-gray-300 focus:border-blue-300 focus:bg-white focus:outline-none disabled:text-gray-300"
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SignalPanel({
  channelId,
  channelName,
  projectId,
}: {
  channelId: number | null
  channelName: string
  projectId: string
}) {
  const { setDecisionContext } = useStudioStore()

  const { data: summary, isError: summaryError } = useAnalysisSummary(channelId)
  const { mutate: triggerAnalysis, isPending: isAnalyzing } = useTriggerAnalysis(channelId)
  const { data: ranking } = useRanking()
  const { mutate: generateHypothesis, isPending: isGenerating } = useGenerateHypothesis()
  const { mutate: runDecOp, isPending: isRunningOp, data: opResult } = useDecisionOperation(projectId)

  const [signals, setSignals] = useState<Signal[]>([])
  const [intent, setIntent] = useState('')
  const [ifCondition, setIfCondition] = useState('')
  const [thenAdjustment, setThenAdjustment] = useState('')
  const [becauseReason, setBecauseReason] = useState('')
  const [proposalSent, setProposalSent] = useState(false)
  const [rankingOpen, setRankingOpen] = useState(false)
  const [opAutoApply, setOpAutoApply] = useState(false)
  const [opAutoSimulate, setOpAutoSimulate] = useState(false)

  // Derive signals whenever analysis summary updates
  useEffect(() => {
    if (summary) {
      setSignals(deriveSignals(summary))
      // Reset hypothesis when analysis refreshes
      setIntent('')
      setIfCondition('')
      setThenAdjustment('')
      setBecauseReason('')
      setProposalSent(false)
    }
  }, [summary])

  const selectedSignals = signals.filter((s) => s.selected)
  const hypothesisReady = intent.trim() && ifCondition.trim() && thenAdjustment.trim() && becauseReason.trim()

  function toggleSignal(id: string) {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)),
    )
    setProposalSent(false)
  }

  function handleGenerateHypothesis() {
    if (!channelId || selectedSignals.length === 0) return
    generateHypothesis(
      {
        channel_id: channelId,
        signals: selectedSignals.map((s) => ({
          id: s.id,
          source_type: s.source_type,
          content: s.content,
          tags: s.tags,
          score: s.score,
        })),
      },
      {
        onSuccess: (data) => {
          setIntent(data.intent)
          setIfCondition(data.if_condition)
          setThenAdjustment(data.then_adjustment)
          setBecauseReason(data.because_reason)
        },
      },
    )
  }

  function handleCreateProposal() {
    if (!channelId || !hypothesisReady) return
    setDecisionContext({
      signals: selectedSignals,
      intent: intent.trim(),
      hypothesis: {
        if_condition: ifCondition.trim(),
        then_adjustment: thenAdjustment.trim(),
        because_reason: becauseReason.trim(),
      },
      source: 'interaction-core',
      channel_id: channelId,
      channel_name: channelName,
      created_at: new Date().toISOString(),
    })
    setProposalSent(true)
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-gray-200 bg-gray-50 overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Signal Panel
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-3 py-3">

        {/* ── Section 1: Analyze ─────────────────────────────────────────── */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              1. Analyze
            </span>
            <button
              onClick={() => triggerAnalysis()}
              disabled={channelId === null || isAnalyzing}
              className="rounded bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {isAnalyzing ? '分析中...' : 'Analyze'}
            </button>
          </div>

          {summaryError && (
            <p className="text-[10px] text-red-400">分析結果を取得できません</p>
          )}

          {summary && (
            <div className="rounded border border-gray-200 bg-white px-2.5 py-2 text-[10px] text-gray-600 space-y-0.5">
              <div>メッセージ: {summary.total_messages} / ユーザー: {summary.active_users}</div>
              <div>
                <span className="text-green-600">+{summary.positive_count}</span>
                {' / '}
                <span className="text-red-500">-{summary.negative_count}</span>
                {' / '}
                <span className="text-blue-500">?{summary.question_count}</span>
              </div>
              {summary.summary_text && (
                <p className="mt-1 leading-relaxed text-gray-500">{summary.summary_text}</p>
              )}
            </div>
          )}

          {!summary && !summaryError && channelId !== null && (
            <p className="text-[10px] text-gray-400">Analyze を押して分析を開始してください</p>
          )}
        </section>

        {/* ── Section 2: Select Signals ──────────────────────────────────── */}
        {signals.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                2. Select Signals
              </span>
              <span className="text-[10px] text-gray-400">
                {selectedSignals.length} 選択中
              </span>
            </div>

            <div className="space-y-1">
              {signals.map((sig) => (
                <label
                  key={sig.id}
                  className="flex cursor-pointer items-start gap-2 rounded border border-gray-100 bg-white px-2 py-1.5 hover:border-blue-200 hover:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    checked={sig.selected}
                    onChange={() => toggleSignal(sig.id)}
                    className="mt-0.5 h-3 w-3 shrink-0 rounded accent-blue-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-700 leading-snug break-words">{sig.content}</p>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {sig.tags.map((t) => <TagBadge key={t} tag={t} />)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>
        )}

        {/* ── Section 3: Generate Hypothesis ────────────────────────────── */}
        {signals.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                3. Hypothesis
              </span>
              <button
                onClick={handleGenerateHypothesis}
                disabled={selectedSignals.length === 0 || isGenerating}
                className="rounded bg-purple-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-purple-700 disabled:opacity-40"
              >
                {isGenerating ? '生成中...' : 'Generate'}
              </button>
            </div>

            <div className="space-y-2 rounded border border-gray-200 bg-white p-2">
              <div className="flex items-start gap-2">
                <span className="mt-1.5 w-16 shrink-0 font-mono text-[10px] font-bold text-gray-400">
                  INTENT
                </span>
                <input
                  type="text"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  disabled={!intent && !isGenerating}
                  placeholder={isGenerating ? '生成中...' : '— Generate を押してください'}
                  className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700 placeholder-gray-300 focus:border-blue-300 focus:bg-white focus:outline-none disabled:text-gray-300"
                />
              </div>

              <HypothesisRow
                label="IF"
                value={ifCondition}
                onChange={setIfCondition}
                disabled={!ifCondition && !isGenerating}
              />
              <HypothesisRow
                label="THEN"
                value={thenAdjustment}
                onChange={setThenAdjustment}
                disabled={!thenAdjustment && !isGenerating}
              />
              <HypothesisRow
                label="BECAUSE"
                value={becauseReason}
                onChange={setBecauseReason}
                disabled={!becauseReason && !isGenerating}
              />
            </div>
          </section>
        )}

        {/* ── Section 4: Create Decision Proposal ───────────────────────── */}
        {signals.length > 0 && (
          <section>
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              4. Propose
            </span>

            {proposalSent ? (
              <div className="flex items-center gap-2 rounded border border-green-200 bg-green-50 px-3 py-2">
                <span className="text-green-600">✓</span>
                <p className="text-[10px] font-medium text-green-700">
                  Improve タブに送信しました
                </p>
                <button
                  onClick={() => {
                    setProposalSent(false)
                    setIntent('')
                    setIfCondition('')
                    setThenAdjustment('')
                    setBecauseReason('')
                    setSignals((prev) => prev.map((s) => ({ ...s, selected: false })))
                  }}
                  className="ml-auto text-[10px] text-gray-400 hover:text-gray-600"
                >
                  クリア
                </button>
              </div>
            ) : (
              <button
                onClick={handleCreateProposal}
                disabled={!hypothesisReady}
                className="w-full rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
              >
                Create Decision Proposal
              </button>
            )}
          </section>
        )}

        {/* ── Section 5: Run Decision Operation ─────────────────────────── */}
        {signals.length > 0 && (
          <section>
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              5. Decision Operation
            </span>

            <div className="rounded border border-gray-200 bg-white px-3 py-2.5 space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-[10px] text-gray-600">
                <input
                  type="checkbox"
                  checked={opAutoApply}
                  onChange={(e) => {
                    setOpAutoApply(e.target.checked)
                    if (!e.target.checked) setOpAutoSimulate(false)
                  }}
                  className="h-3 w-3 accent-blue-600"
                />
                Auto apply after creation
              </label>
              <label className={`flex cursor-pointer items-center gap-2 text-[10px] ${opAutoApply ? 'text-gray-600' : 'text-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={opAutoSimulate}
                  onChange={(e) => setOpAutoSimulate(e.target.checked)}
                  disabled={!opAutoApply}
                  className="h-3 w-3 accent-blue-600"
                />
                Auto run simulation after apply
              </label>

              {opResult && (
                <div className="rounded bg-green-50 px-2 py-1.5 text-[10px] text-green-700">
                  {opResult.applied ? '✓ フローに反映済み' : '✓ Suggestion 作成済み'}
                  {opResult.simulation_run && ' · シミュレーション完了'}
                </div>
              )}

              <button
                onClick={() => {
                  if (!channelId || !hypothesisReady) return
                  runDecOp({
                    intent: intent.trim(),
                    if_condition: ifCondition.trim(),
                    then_adjustment: thenAdjustment.trim(),
                    because_reason: becauseReason.trim(),
                    auto_apply: opAutoApply,
                    auto_simulate: opAutoSimulate,
                  })
                }}
                disabled={!hypothesisReady || isRunningOp}
                className="w-full rounded bg-indigo-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                {isRunningOp ? '実行中...' : 'Run Decision Operation'}
              </button>
            </div>
          </section>
        )}

        {/* ── Section 6: Ranking (collapsible) ──────────────────────────── */}
        {ranking && ranking.length > 0 && (
          <section>
            <button
              onClick={() => setRankingOpen((o) => !o)}
              className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600"
            >
              <span>Ranking</span>
              <span>{rankingOpen ? '▲' : '▼'}</span>
            </button>

            {rankingOpen && (
              <div className="mt-2 space-y-1">
                {ranking.slice(0, 5).map((entry) => (
                  <div
                    key={entry.user_id}
                    className="flex items-center justify-between rounded border border-gray-100 bg-white px-2 py-1"
                  >
                    <span className="text-[10px] text-gray-600">
                      #{entry.rank} {entry.display_name}
                    </span>
                    <span className="text-[10px] font-medium text-gray-700">
                      {entry.points}pt{' '}
                      <span className={`text-[9px] ${entry.level === 'Platinum' ? 'text-blue-500' : entry.level === 'Gold' ? 'text-yellow-500' : 'text-gray-400'}`}>
                        {entry.level}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
