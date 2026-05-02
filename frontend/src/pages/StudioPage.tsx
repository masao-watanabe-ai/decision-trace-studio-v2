import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { HeaderBar } from '../components/layout/HeaderBar'
import { GuidedDemoPanel } from '../features/demo/GuidedDemoPanel'
import { FlowCanvas } from '../features/flow-editor/FlowCanvas'
import { NodeDetailPanel } from '../features/flow-editor/NodeDetailPanel'
import { ImprovePanel } from '../features/improve/ImprovePanel'
import { InteractionPanel } from '../features/interaction/InteractionPanel'
import { ComparisonPanel } from '../features/simulation/ComparisonPanel'
import { SimulationPanel } from '../features/simulation/SimulationPanel'
import { useCurrentFlow, useUpdateFlow } from '../hooks/useFlow'
import { useProject } from '../hooks/useProjects'
import type { FlowEdge, FlowNode } from '../lib/api/flows'
import { useStudioStore } from '../store/studioStore'

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = 'flow' | 'simulate' | 'compare' | 'improve' | 'interact'

const TABS: { key: Tab; label: string; hint: string }[] = [
  {
    key: 'flow',
    label: 'Design',
    hint: 'ノードとエッジを視覚的に編集する',
  },
  {
    key: 'simulate',
    label: 'Simulate',
    hint: 'シナリオを生成してフローを実行検証',
  },
  {
    key: 'compare',
    label: 'Compare',
    hint: 'Before / After でフロー変更を比較',
  },
  {
    key: 'improve',
    label: 'Improve',
    hint: '改善提案を生成して Flow に反映',
  },
  {
    key: 'interact',
    label: 'Interact',
    hint: 'Interaction Core — シグナル収集・仮説生成・Decision Proposal',
  },
]

// ─── Dirty-state helpers ──────────────────────────────────────────────────────

function flowSignature(nodes: FlowNode[], edges: FlowEdge[]): string {
  const n = nodes
    .map(
      (n) =>
        `${n.id}:${n.type}:${Math.round(n.position.x)}:${Math.round(n.position.y)}:${n.condition}:${n.action}:${n.priority}`,
    )
    .sort()
    .join(';')
  const e = edges
    .map((e) => `${e.id}:${e.source}:${e.target}`)
    .sort()
    .join(';')
  return `${n}|${e}`
}

// ─── StudioPage ───────────────────────────────────────────────────────────────

export function StudioPage() {
  const { projectId = '' } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('flow')

  // ── Demo state ───────────────────────────────────────────────────────────
  const { demoStep, setDemoStep } = useStudioStore()

  useEffect(() => {
    // Auto-switch tab when demo step changes
    const TAB_MAP: Record<number, Tab> = {
      0: 'flow',
      1: 'simulate',
      2: 'simulate',
      3: 'compare',
      4: 'improve',
      5: 'improve',
      6: 'simulate',
    }
    if (demoStep !== null && TAB_MAP[demoStep]) {
      setActiveTab(TAB_MAP[demoStep])
    }
  }, [demoStep])

  // ── Server data ──────────────────────────────────────────────────────────
  const { data: project } = useProject(projectId)
  const { data: flow, isLoading, isError } = useCurrentFlow(projectId)
  const { mutate: saveFlow, isPending: isSaving, isSuccess: isSaved } = useUpdateFlow(projectId)

  // ── RF draft (latest canvas state including drag positions) ──────────────
  const rfDraftRef = useRef<{ nodes: FlowNode[]; edges: FlowEdge[] } | null>(null)

  // ── Dirty tracking ───────────────────────────────────────────────────────
  const [isDirty, setIsDirty] = useState(false)
  const lastSavedSigRef = useRef<string | null>(null)

  function handleFlowChange(nodes: FlowNode[], edges: FlowEdge[]) {
    rfDraftRef.current = { nodes, edges }
    if (lastSavedSigRef.current === null) {
      // Flow not yet initialized — treat first change as the baseline
      if (flow) {
        lastSavedSigRef.current = flowSignature(flow.nodes, flow.edges)
      }
      return
    }
    const current = flowSignature(nodes, edges)
    setIsDirty(current !== lastSavedSigRef.current)
  }

  // ── Undo (1 step) ────────────────────────────────────────────────────────
  const [undoSnapshot, setUndoSnapshot] = useState<{
    nodes: FlowNode[]
    edges: FlowEdge[]
  } | null>(null)

  // ── Save ─────────────────────────────────────────────────────────────────
  function handleSave() {
    if (!flow) return
    const draft = rfDraftRef.current ?? { nodes: flow.nodes, edges: flow.edges }

    // Store the current server state as undo snapshot BEFORE saving
    setUndoSnapshot({ nodes: flow.nodes, edges: flow.edges })

    saveFlow(
      { flowId: flow.id, input: draft },
      {
        onSuccess: () => {
          const sig = flowSignature(draft.nodes, draft.edges)
          lastSavedSigRef.current = sig
          setIsDirty(false)
        },
      },
    )
  }

  // ── Undo ─────────────────────────────────────────────────────────────────
  function handleUndo() {
    if (!flow || !undoSnapshot) return
    saveFlow(
      { flowId: flow.id, input: undoSnapshot },
      {
        onSuccess: () => {
          const sig = flowSignature(undoSnapshot.nodes, undoSnapshot.edges)
          lastSavedSigRef.current = sig
          rfDraftRef.current = null
          setIsDirty(false)
          setUndoSnapshot(null)
        },
      },
    )
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <HeaderBar
        projectName={project?.name ?? ''}
        flowVersion={flow?.version}
        isDirty={isDirty}
        isSaving={isSaving}
        isSaved={isSaved}
        canUndo={undoSnapshot !== null}
        showSaveButton={activeTab === 'flow'}
        isDemoActive={demoStep !== null}
        onSave={handleSave}
        onUndo={handleUndo}
        onStartDemo={() => setDemoStep(0)}
      />

      {/* Tab bar */}
      <div className="flex shrink-0 items-end border-b border-gray-200 bg-white px-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Current tab hint */}
      <div className="shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-1">
        <p className="text-[11px] text-gray-400">
          {TABS.find((t) => t.key === activeTab)?.hint}
        </p>
      </div>

      {/* Content */}
      {activeTab === 'flow' && (
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden border-r border-gray-200 bg-white">
            {isLoading && <p className="p-6 text-sm text-gray-500">読み込み中...</p>}
            {isError && (
              <p className="p-6 text-sm text-red-500">Flow の取得に失敗しました。</p>
            )}
            {flow && (
              <FlowCanvas
                nodes={flow.nodes}
                edges={flow.edges}
                onFlowChange={handleFlowChange}
              />
            )}
          </main>
          <aside className="w-72 shrink-0 overflow-auto border-l border-gray-200 bg-gray-50">
            <NodeDetailPanel />
          </aside>
        </div>
      )}

      {activeTab === 'simulate' && (
        <div className="flex-1 overflow-auto bg-white">
          <SimulationPanel projectId={projectId} />
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="flex-1 overflow-auto bg-white">
          <ComparisonPanel projectId={projectId} />
        </div>
      )}

      {activeTab === 'improve' && (
        <div className="flex-1 overflow-auto bg-white">
          <ImprovePanel
            projectId={projectId}
            onGoToSimulate={() => setActiveTab('simulate')}
            onGoToCompare={() => setActiveTab('compare')}
          />
        </div>
      )}

      {activeTab === 'interact' && (
        <div className="flex-1 overflow-hidden">
          <InteractionPanel projectId={projectId} />
        </div>
      )}

      {/* Guided Demo Panel */}
      <GuidedDemoPanel onTabSwitch={(tab) => setActiveTab(tab as Tab)} />
    </div>
  )
}
