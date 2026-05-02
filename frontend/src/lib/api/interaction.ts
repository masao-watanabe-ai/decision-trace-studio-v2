import type { Signal } from '../../types/interaction'

const BASE_URL = (import.meta.env.VITE_INTERACTION_CORE_URL as string | undefined) ?? 'http://localhost:8001'
const TOKEN_KEY = 'interaction_core_token'

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function devLogin(userId = 1): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { access_token: string }
    localStorage.setItem(TOKEN_KEY, data.access_token)
    return data.access_token
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Base fetch ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers ?? {}),
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    throw new Error(`interaction-core ${init?.method ?? 'GET'} ${path} → ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Response types ────────────────────────────────────────────────────────────

export type IChannel = {
  id: number
  name: string
  workspace_id: number
}

export type IMessage = {
  id: number
  channel_id: number
  user_id: number
  content: string
  created_at: string
}

export type IAnalysisSummary = {
  channel_id: number
  total_messages: number
  top_keywords: string[]
  positive_count: number
  negative_count: number
  question_count: number
  active_users: number
  summary_text: string
  insights: string[]
  suggested_actions: string[]
  analyzed_at: string
}

export type IRankingEntry = {
  user_id: number
  display_name: string
  points: number
  level: string
  rank: number
  enthusiasm_score: number
  insight_quality_score: number
  discussion_impact_score: number
  decision_contribution_score: number
  impact_score: number
}

export type IHypothesizeResponse = {
  intent: string
  if_condition: string
  then_adjustment: string
  because_reason: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function fetchChannels(): Promise<IChannel[]> {
  return apiFetch<IChannel[]>('/channels')
}

export function fetchMessages(channelId: number, limit = 50): Promise<IMessage[]> {
  return apiFetch<IMessage[]>(`/channels/${channelId}/messages?limit=${limit}`)
}

export function sendMessage(channelId: number, content: string): Promise<IMessage> {
  return apiFetch<IMessage>(`/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export function triggerAnalysis(channelId: number): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/analysis/channels/${channelId}`, { method: 'POST' })
}

export function fetchAnalysisSummary(channelId: number): Promise<IAnalysisSummary> {
  return apiFetch<IAnalysisSummary>(`/analysis/channels/${channelId}/summary`)
}

export function fetchRanking(workspaceId = 1): Promise<IRankingEntry[]> {
  return apiFetch<IRankingEntry[]>(`/scores/ranking?workspace_id=${workspaceId}`)
}

export type HypothesizeRequest = {
  channel_id: number
  signals: Pick<Signal, 'id' | 'source_type' | 'content' | 'tags' | 'score'>[]
}

export function generateHypothesis(req: HypothesizeRequest): Promise<IHypothesizeResponse> {
  return apiFetch<IHypothesizeResponse>('/signals/hypothesize', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export { BASE_URL }
