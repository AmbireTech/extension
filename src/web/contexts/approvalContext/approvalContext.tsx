import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import useExtensionWallet from '@common/hooks/useExtensionWallet'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import useAuth from '@common/modules/auth/hooks/useAuth'
import useVault from '@common/modules/vault/hooks/useVault'
import { delayPromise } from '@common/utils/promises'
import { Approval } from '@web/extension-services/background/services/notification'
import { getUiType } from '@web/utils/uiType'

import { UseExtensionApprovalReturnType } from './types'
import useSignApproval from './useSignApproval'

// In the cases when the dApp requests multiple approvals, but waits the
// response from the prev one to request the next one. For example
// this happens with https://polygonscan.com/ and https://bscscan.com/
// when you try to "Add Token to Web3 Wallet".
const MAGIC_DELAY_THAT_FIXES_CONCURRENT_DAPP_APPROVAL_REQUESTS = 850

const ApprovalContext = createContext<UseExtensionApprovalReturnType>({
  approval: null,
  requests: [],
  hasCheckedForApprovalInitially: false,
  getApproval: () => Promise.resolve(null),
  resolveApproval: () => Promise.resolve(),
  rejectApproval: () => Promise.resolve(),
  resolveMany: () => {}
})

const ApprovalProvider: React.FC<any> = ({ children }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { authStatus } = useAuth()
  const { vaultStatus } = useVault()
  const { navigate } = useNavigation()
  const { extensionWallet } = useExtensionWallet()
  const [approval, setApproval] = useState<Approval | null>(null)
  const [hasCheckedForApprovalInitially, setHasCheckedForApprovalInitially] = useState(false)

  const getApproval: UseExtensionApprovalReturnType['getApproval'] = useCallback(
    () => extensionWallet!.getApproval(),
    [extensionWallet]
  )

  const resolveApproval = useCallback<UseExtensionApprovalReturnType['resolveApproval']>(
    async (data = undefined, stay = false, forceReject = false, approvalId = undefined) => {
      if (!approval) {
        return addToast(
          t(
            'Missing approval request from the dApp. Please close this window and trigger the action again from the dApp.'
          ),
          { error: true }
        )
      }

      await extensionWallet!.resolveApproval(data, forceReject, approvalId)

      await delayPromise(MAGIC_DELAY_THAT_FIXES_CONCURRENT_DAPP_APPROVAL_REQUESTS)

      const nextApproval = await getApproval()
      setApproval(nextApproval)

      if (stay) {
        return
      }

      // Navigate to the main route after the approval is resolved, which
      // triggers the logic that determines where user should go next.
      setTimeout(() => navigate('/'))
    },
    [addToast, approval, extensionWallet, getApproval, t, navigate]
  )

  const rejectApproval = useCallback<UseExtensionApprovalReturnType['rejectApproval']>(
    async (err = undefined, stay = false, isInternal = false) => {
      if (!approval) {
        return addToast(
          t(
            'Missing approval request from the dApp. Please close this window and trigger the action again from the dApp.'
          ),
          { error: true }
        )
      }

      await extensionWallet!.rejectApproval(err, stay, isInternal)

      await delayPromise(MAGIC_DELAY_THAT_FIXES_CONCURRENT_DAPP_APPROVAL_REQUESTS)

      const nextApproval = await getApproval()
      setApproval(nextApproval)

      // Navigate to the main route after the approval is resolved, which
      // triggers the logic that determines where user should go next.
      if (!stay) navigate('/')
    },
    [approval, extensionWallet, getApproval, addToast, t, navigate]
  )

  const { requests, resolveMany } = useSignApproval({ approval, resolveApproval, rejectApproval })

  useEffect(() => {
    if (!getUiType().isNotification) return

    // Be aware, that this window listener might not get trigger on all
    // browsers. The `rejectApproval` gets triggered on Chrome, even  without
    // this listener. But it might be needed for other browsers or use-cases.
    window.addEventListener('beforeunload', rejectApproval)

    return () => window.removeEventListener('beforeunload', rejectApproval)
  }, [rejectApproval])

  useEffect(() => {
    ;(async () => {
      if (getUiType().isNotification) {
        const currentApproval = await getApproval()
        setApproval(currentApproval)
      }

      setHasCheckedForApprovalInitially(true)
    })()
  }, [
    getApproval,
    // Re-get the approval since when the vault is locked and then unlocked -
    // the approval data changes. Use case: extension is locked, user is
    // authenticated, dApp requests something, user unlocks the extension.
    vaultStatus,
    // Re-get the approval since when there are no accounts and then - the user
    // adds an account (and therefore - authenticates) - the approval data changes
    authStatus
  ])

  return (
    <ApprovalContext.Provider
      value={useMemo(
        () => ({
          approval,
          requests,
          hasCheckedForApprovalInitially,
          getApproval,
          resolveApproval,
          rejectApproval,
          resolveMany
        }),
        [
          approval,
          requests,
          hasCheckedForApprovalInitially,
          getApproval,
          resolveApproval,
          rejectApproval,
          resolveMany
        ]
      )}
    >
      {children}
    </ApprovalContext.Provider>
  )
}

export { ApprovalProvider, ApprovalContext }
