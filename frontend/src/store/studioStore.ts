import { create } from 'zustand'
import { type FlowNode } from '../lib/api/flows'
import type { DecisionContext } from '../types/interaction'

type StudioState = {
  selectedNode: FlowNode | null
  setSelectedNode: (node: FlowNode | null) => void
  demoStep: number | null
  setDemoStep: (step: number | null) => void
  activeChannelId: number | null
  setActiveChannelId: (id: number | null) => void
  decisionContext: DecisionContext | null
  setDecisionContext: (ctx: DecisionContext | null) => void
  clearDecisionContext: () => void
}

export const useStudioStore = create<StudioState>((set) => ({
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  demoStep: null,
  setDemoStep: (step) => set({ demoStep: step }),
  activeChannelId: null,
  setActiveChannelId: (id) => set({ activeChannelId: id }),
  decisionContext: null,
  setDecisionContext: (ctx) => set({ decisionContext: ctx }),
  clearDecisionContext: () => set({ decisionContext: null }),
}))
