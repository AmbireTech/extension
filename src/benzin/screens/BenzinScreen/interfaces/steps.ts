export type FinalizedStatusType = {
  status: 'confirmed' | 'dropped' | 'rejected' | 'failed' | 'fetching' | 'not-found'
  reason?: string
} | null

export type ActiveStepType = 'signed' | 'in-progress' | 'finalized'
