import { useContext } from 'react'

import { ApprovalContext } from '@web/contexts/approvalContext'

export default function useApproval() {
  const context = useContext(ApprovalContext)

  if (!context) {
    throw new Error('useApproval must be used within an ApprovalProvider')
  }

  return context
}
