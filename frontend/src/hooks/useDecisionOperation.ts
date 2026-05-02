import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DecisionOperationRequest } from '../lib/api/decisionOperation'
import { runDecisionOperation } from '../lib/api/decisionOperation'

export function useDecisionOperation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: DecisionOperationRequest) => runDecisionOperation(projectId, req),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['suggestions', projectId] })
      if (result.applied) {
        queryClient.invalidateQueries({ queryKey: ['flows', projectId, 'current'] })
      }
      if (result.simulation_run) {
        queryClient.invalidateQueries({ queryKey: ['simulations', projectId] })
        queryClient.invalidateQueries({ queryKey: ['traces', projectId] })
      }
    },
  })
}
