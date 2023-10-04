import { isExtension } from '@web/constants/browserapi'
import { Approval } from '@web/extension-services/background/services/notification'

export const APPROVAL_REQUESTS_STORAGE_KEY = isExtension
  ? 'ambire_extension_state'
  : 'approval_requests_state'

export type UseExtensionApprovalReturnType = {
  approval: Approval | null
  requests: any[] | null
  hasCheckedForApprovalInitially: boolean
  getApproval: () => Promise<Approval | null>
  resolveApproval: (data: any, stay?: boolean, forceReject?: boolean, approvalId?: string) => void
  rejectApproval: (err: any, stay?: boolean, isInternal?: boolean) => void
  resolveMany: (ids: any, resolution: any) => any
  rejectAllApprovals?: () => void
}
