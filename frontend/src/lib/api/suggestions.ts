import { apiClient } from './client'
import type { NodeType } from './flows'

export type SuggestionType = 'boundary_add' | 'condition_split' | 'priority_adjust' | 'context_node_add'
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected'

export type Suggestion = {
  id: string
  project_id: string
  type: SuggestionType
  target_node_id: string | null
  reason: string
  impact: string
  proposed_node_type: NodeType | null
  proposed_label: string | null
  proposed_condition: string | null
  proposed_action: string | null
  proposed_priority: number | null
  status: SuggestionStatus
  applied_to_flow: boolean
}

export type AdditionalContext = {
  intent?: string
  if_condition?: string
  then_adjustment?: string
  because_reason?: string
  signals?: { content: string; tags: string[]; score: number | null }[]
}

export function generateSuggestions(
  projectId: string,
  additionalContext?: AdditionalContext,
): Promise<Suggestion[]> {
  return apiClient.post<Suggestion[]>(`/projects/${projectId}/suggestions/generate`, {
    additional_context: additionalContext ?? null,
  })
}

export function fetchSuggestions(projectId: string): Promise<Suggestion[]> {
  return apiClient.get<Suggestion[]>(`/projects/${projectId}/suggestions`)
}

export function acceptSuggestion(suggestionId: string): Promise<Suggestion> {
  return apiClient.post<Suggestion>(`/suggestions/${suggestionId}/accept`, {})
}

export function rejectSuggestion(suggestionId: string): Promise<Suggestion> {
  return apiClient.post<Suggestion>(`/suggestions/${suggestionId}/reject`, {})
}

export type FromContextRequest = {
  intent: string
  if_condition: string
  then_adjustment: string
  because_reason: string
}

export function createSuggestionFromContext(
  projectId: string,
  req: FromContextRequest,
): Promise<Suggestion> {
  return apiClient.post<Suggestion>(`/projects/${projectId}/suggestions/from-context`, req)
}
