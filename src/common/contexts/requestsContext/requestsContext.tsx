// TODO: fill in the missing types
import usePrevious from 'ambire-common/src/hooks/usePrevious'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import { isAndroid, isiOS } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAccounts from '@common/hooks/useAccounts'
import useExtensionWallet from '@common/hooks/useExtensionWallet'
import useGnosisSafe from '@common/hooks/useGnosis'
import useNavigation from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import useToast from '@common/hooks/useToast'
import useWalletConnect from '@common/hooks/useWalletConnect'
import PendingTransactionsScreen from '@common/modules/pending-transactions/screens/PendingTransactionsScreen'
import { ROUTES } from '@common/modules/router/constants/common'
import SignMessageScreen from '@common/modules/sign-message/screens/SignMessageScreen'
import colors from '@common/styles/colors'
import { isExtension } from '@web/constants/browserapi'
import { APPROVAL_REQUESTS_STORAGE_KEY } from '@web/contexts/approvalContext/types'
import { checkBrowserWindowsForExtensionPopup } from '@web/utils/checkBrowserWindowsForExtensionPopup'
import { getUiType } from '@web/utils/uiType'

import useWeb3Approval from './useWeb3Approval'

export interface RequestsContextReturnType {
  internalRequests: any
  sendTxnState: {
    showing: boolean
    [key: string]: any
  }
  prevSendTxnState: {
    showing: boolean
    [key: string]: any
  }
  eligibleRequests: any[]
  everythingToSign: any[]
  setSendTxnState: (sendTxnState: { showing: boolean; [key: string]: any }) => any
  addRequest: (req: any) => any
  onBroadcastedTxn: (hash: any) => void
  confirmSentTx: (txHash: any) => void
  resolveMany: (ids: any, resolution: any) => void
  showSendTxns: (replacementBundle: any, replaceByDefault?: boolean) => void
  onDismissSendTxns: () => void
}

const RequestsContext = createContext<RequestsContextReturnType>({
  internalRequests: [],
  sendTxnState: {
    showing: false
  },
  prevSendTxnState: {
    showing: false
  },
  eligibleRequests: [],
  everythingToSign: [],
  setSendTxnState: () => {},
  addRequest: () => {},
  onBroadcastedTxn: () => {},
  confirmSentTx: () => {},
  resolveMany: () => {},
  showSendTxns: () => {},
  onDismissSendTxns: () => {}
})

const RequestsProvider: React.FC = ({ children }) => {
  const { accounts, selectedAcc } = useAccounts()
  const { network }: any = useNetwork()
  const { navigate } = useNavigation()
  const { requests: wcRequests, resolveMany: wcResolveMany } = useWalletConnect()
  const { requests: gnosisRequests, resolveMany: gnosisResolveMany } = useGnosisSafe()
  const { requests: approvalRequests, resolveMany: approvalResolveMany } = useWeb3Approval()
  const { addToast } = useToast()
  const { t } = useTranslation()
  const {
    ref: sheetRefSendTxn,
    open: openBottomSheetSendTxn,
    close: closeBottomSheetSendTxn
  } = useModalize()

  const {
    ref: sheetRefSignMsg,
    open: openBottomSheetSignMsg,
    close: closeBottomSheetSignMsg
  } = useModalize()

  const { extensionWallet } = useExtensionWallet()
  const [internalRequests, setInternalRequests] = useState<any>([])
  // Keeping track of sent transactions
  const [sentTxn, setSentTxn] = useState<any[]>([])

  const addRequest = useCallback(
    (req: any) => setInternalRequests((reqs: any) => [...reqs, req]),
    []
  )

  const requests = useMemo(
    () =>
      [...internalRequests, ...wcRequests, ...gnosisRequests, ...approvalRequests].filter(
        ({ account }) => accounts.find(({ id }: any) => id === account)
      ),
    [internalRequests, wcRequests, gnosisRequests, approvalRequests, accounts]
  )

  // Filter only the sign message requests
  const everythingToSign = useMemo(
    () =>
      requests.filter(
        ({ type, account }) =>
          [
            'personal_sign',
            'eth_sign',
            'eth_signTypedData',
            'eth_signTypedData_v1',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4'
          ].includes(type) && account === selectedAcc
      ),
    [requests, selectedAcc]
  )

  // Filter only the send transaction requests
  const eligibleRequests = useMemo(
    () =>
      requests.filter(
        ({ type, chainId, account }) =>
          type === 'eth_sendTransaction' && chainId === network.chainId && account === selectedAcc
      ),
    [requests, network?.chainId, selectedAcc]
  )
  // Docs: the state is { showing: bool, replacementBundle, replaceByDefault: bool, mustReplaceNonce: number }
  // mustReplaceNonce is set when the end goal is to replace a particular transaction, and if that txn gets mined we should stop the user from doing anything
  // mustReplaceNonce must always be used together with either replaceByDefault: true or replacementBundle
  const [sendTxnState, setSendTxnState] = useState<{
    showing: boolean
    [key: string]: any
  }>(() => ({
    showing: !!eligibleRequests.length
  }))

  const prevSendTxnState: any = usePrevious(sendTxnState)

  useEffect(() => {
    setSendTxnState((prev) => ({
      showing: !!eligibleRequests.length,
      // we only keep those if there are transactions, otherwise zero them
      replaceByDefault: eligibleRequests.length ? prev.replaceByDefault : null,
      mustReplaceNonce: eligibleRequests.length ? prev.mustReplaceNonce : null
    }))
  }, [eligibleRequests.length])

  const onBroadcastedTxn = useCallback(
    (hash: any) => {
      if (!hash) {
        addToast(t('Transaction signed but not broadcasted to the network!') as string, {
          timeout: 15000
        })
        return
      }
      setSentTxn((txn: any) => [...txn, { confirmed: false, hash }])
      addToast(t('Transaction signed and sent successfully!') as string, {
        onClick: () => navigate(ROUTES.transactions),
        timeout: 15000
      })
    },
    [addToast, t, navigate]
  )

  const confirmSentTx = useCallback(
    (txHash: any) =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      setSentTxn((sentTxn) => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const tx = sentTxn.find((tx: any) => tx.hash === txHash)
        tx.confirmed = true
        // eslint-disable-next-line @typescript-eslint/no-shadow
        return [...sentTxn.filter((tx: any) => tx.hash !== txHash), tx]
      }),
    []
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resolveMany = useCallback(
    (ids: any, resolution: any) => {
      gnosisResolveMany(ids, resolution)
      wcResolveMany(ids, resolution)
      approvalResolveMany(ids, resolution)
      setInternalRequests((reqs: any) => reqs.filter((x: any) => !ids.includes(x.id)))
    },
    [gnosisResolveMany, wcResolveMany, approvalResolveMany]
  )

  const showSendTxns = useCallback(
    (replacementBundle: any, replaceByDefault = false) =>
      setSendTxnState({ showing: true, replacementBundle, replaceByDefault }),
    [setSendTxnState]
  )
  // keep values such as replaceByDefault and mustReplaceNonce; those will be reset on any setSendTxnState/showSendTxns
  // we DONT want to keep replacementBundle - closing the dialog means you've essentially dismissed it
  // also, if you used to be on a replacementBundle, we DON'T want to keep those props
  const onDismissSendTxns = useCallback(
    () =>
      setSendTxnState((prev) =>
        prev.replacementBundle
          ? { showing: false }
          : {
              showing: false,
              replaceByDefault: prev.replaceByDefault,
              mustReplaceNonce: prev.mustReplaceNonce
            }
      ),
    [setSendTxnState]
  )

  // Handle navigation for sign message requests
  useEffect(() => {
    ;(async () => {
      let toSign = everythingToSign

      if (isExtension && getUiType().isPopup) {
        toSign = everythingToSign.filter((r) => r?.reqSrc !== APPROVAL_REQUESTS_STORAGE_KEY)
      }

      if (toSign.length) {
        if (
          (isiOS || isAndroid) &&
          everythingToSign.filter((r) => r?.reqSrc !== APPROVAL_REQUESTS_STORAGE_KEY)
        ) {
          openBottomSheetSignMsg()
        } else {
          navigate(ROUTES.signMessage)
        }
      } else if (
        // Extension only
        // In case there is a pending sign msg request opened in a notification window
        // and at the same time the popup window is triggered just force open
        // the the notification window to finalize the request before being able to continue
        everythingToSign.filter((r) => r?.reqSrc === APPROVAL_REQUESTS_STORAGE_KEY).length &&
        isExtension &&
        getUiType().isPopup
      ) {
        const { extensionPopupExists } = await checkBrowserWindowsForExtensionPopup()
        if (extensionPopupExists) {
          extensionWallet!.activeFirstApproval()
          window.close()
        } else {
          browser.storage.local.set({
            [APPROVAL_REQUESTS_STORAGE_KEY]: JSON.stringify([])
          })
        }
      }
    })()
  }, [everythingToSign, extensionWallet, navigate, openBottomSheetSignMsg])

  // Handle navigation for send txn requests
  useEffect(() => {
    ;(async () => {
      setTimeout(async () => {
        if (sendTxnState?.showing && !prevSendTxnState?.showing) {
          // Extension only
          // In case there is a pending send txn request opened in a notification window
          // and at the same time the popup window is triggered just force open
          // the the notification window to finalize the request before being able to continue
          if (
            eligibleRequests.filter((r) => r?.reqSrc === APPROVAL_REQUESTS_STORAGE_KEY).length &&
            isExtension &&
            getUiType().isPopup
          ) {
            const { extensionPopupExists } = await checkBrowserWindowsForExtensionPopup()
            if (extensionPopupExists) {
              extensionWallet!.activeFirstApproval()
              window.close()
            } else {
              browser.storage.local.set({
                [APPROVAL_REQUESTS_STORAGE_KEY]: JSON.stringify([])
              })
            }
          } else if (
            eligibleRequests.filter((r) => r?.reqSrc === APPROVAL_REQUESTS_STORAGE_KEY).length &&
            (isiOS || isAndroid)
          ) {
            openBottomSheetSendTxn()
          } else {
            navigate(ROUTES.pendingTransactions)
          }
        }
      }, 1)
    })()
  }, [
    sendTxnState?.showing,
    prevSendTxnState?.showing,
    eligibleRequests,
    extensionWallet,
    navigate,
    openBottomSheetSendTxn
  ])

  return (
    <RequestsContext.Provider
      value={useMemo(
        () => ({
          internalRequests,
          sendTxnState,
          eligibleRequests,
          everythingToSign,
          prevSendTxnState,
          setSendTxnState,
          addRequest,
          onBroadcastedTxn,
          confirmSentTx,
          resolveMany,
          showSendTxns,
          onDismissSendTxns
        }),
        [
          internalRequests,
          sendTxnState,
          eligibleRequests,
          everythingToSign,
          prevSendTxnState,
          setSendTxnState,
          addRequest,
          onBroadcastedTxn,
          confirmSentTx,
          resolveMany,
          showSendTxns,
          onDismissSendTxns
        ]
      )}
    >
      {children}
      <BottomSheet
        id="bottom-sheet-send-txn"
        sheetRef={sheetRefSendTxn}
        closeBottomSheet={() => {
          closeBottomSheetSendTxn()
        }}
        style={{ backgroundColor: colors.martinique }}
        displayCancel={false}
      >
        <PendingTransactionsScreen isInBottomSheet closeBottomSheet={closeBottomSheetSendTxn} />
      </BottomSheet>
      <BottomSheet
        id="bottom-sheet-sign-msg"
        sheetRef={sheetRefSignMsg}
        closeBottomSheet={() => {
          closeBottomSheetSignMsg()
        }}
        style={{ backgroundColor: colors.martinique }}
        displayCancel={false}
      >
        <SignMessageScreen isInBottomSheet closeBottomSheet={closeBottomSheetSignMsg} />
      </BottomSheet>
    </RequestsContext.Provider>
  )
}

export { RequestsContext, RequestsProvider }
