import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  devLogin,
  fetchAnalysisSummary,
  fetchChannels,
  fetchMessages,
  fetchRanking,
  generateHypothesis,
  sendMessage,
  triggerAnalysis,
} from '../lib/api/interaction'
import type { HypothesizeRequest } from '../lib/api/interaction'

export function useChannels() {
  return useQuery({
    queryKey: ['interaction-channels'],
    queryFn: fetchChannels,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useMessages(channelId: number | null) {
  return useQuery({
    queryKey: ['interaction-messages', channelId],
    queryFn: () => fetchMessages(channelId!),
    enabled: channelId !== null,
    staleTime: 0,
    retry: 1,
  })
}

export function useSendMessage(channelId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => sendMessage(channelId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interaction-messages', channelId] })
    },
  })
}

export function useAnalysisSummary(channelId: number | null) {
  return useQuery({
    queryKey: ['interaction-analysis', channelId],
    queryFn: () => fetchAnalysisSummary(channelId!),
    enabled: channelId !== null,
    staleTime: 0,
    retry: 1,
  })
}

export function useTriggerAnalysis(channelId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => triggerAnalysis(channelId!),
    onSuccess: () => {
      // Analysis runs async — poll summary after a short delay via refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['interaction-analysis', channelId] })
        queryClient.invalidateQueries({ queryKey: ['interaction-ranking'] })
      }, 3_000)
    },
  })
}

export function useRanking() {
  return useQuery({
    queryKey: ['interaction-ranking'],
    queryFn: () => fetchRanking(),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useGenerateHypothesis() {
  return useMutation({
    mutationFn: (req: HypothesizeRequest) => generateHypothesis(req),
  })
}

export function useDevLogin() {
  return useMutation({
    mutationFn: (userId?: number) => devLogin(userId ?? 1),
  })
}
