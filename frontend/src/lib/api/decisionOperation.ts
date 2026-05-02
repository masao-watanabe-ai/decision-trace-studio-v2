import { apiClient } from './client'
import type { Suggestion } from './suggestions'
import type { SimulationRun } from './simulations'

export type DecisionOperationRequest = {
  intent: string
  if_condition: string
  then_adjustment: string
  because_reason: string
  auto_apply?: boolean
  auto_simulate?: boolean
}

export type DecisionOperationResult = {
  suggestion: Suggestion
  applied: boolean
  simulation_run: SimulationRun | null
}

export function runDecisionOperation(
  projectId: string,
  req: DecisionOperationRequest,
): Promise<DecisionOperationResult> {
  return apiClient.post<DecisionOperationResult>(
    `/projects/${projectId}/decision-operation`,
    req,
  )
}
