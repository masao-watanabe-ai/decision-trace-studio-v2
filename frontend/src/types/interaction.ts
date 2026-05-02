export type SignalSourceType = 'message' | 'analysis' | 'evidence'

export type Signal = {
  id: string
  source_type: SignalSourceType
  source_id: string | number
  content: string
  tags: string[]
  score: number | null
  selected: boolean
}

export type DecisionHypothesis = {
  if_condition: string
  then_adjustment: string
  because_reason: string
}

export type DecisionContext = {
  signals: Signal[]
  intent: string
  hypothesis: DecisionHypothesis
  source: 'interaction-core'
  channel_id: number
  channel_name: string
  created_at: string
}
