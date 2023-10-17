// TODO: fill in the missing types
import usePrevious from 'ambire-common/src/hooks/usePrevious'
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import { isAndroid, isiOS } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAccounts from '@common/hooks/useAccounts'
import useExtensionWallet from '@common/hooks/useExtensionWallet'
import useGnosisSafe from '@common/hooks/useGnosis'
import useNavigation from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import useRoute from '@common/hooks/useRoute'
import useToast from '@common/hooks/useToast'
import { PendingTransactionsProvider } from '@common/modules/pending-transactions/contexts/pendingTransactionsContext'
import PendingTransactionsScreen from '@common/modules/pending-transactions/screens/PendingTransactionsScreen'
import { MOBILE_ROUTES, ROUTES } from '@common/modules/router/constants/common'
import SignMessageScreen from '@common/modules/sign-message/screens/SignMessageScreen'
import { VAULT_STATUS } from '@common/modules/vault/constants/vaultStatus'
import useVault from '@common/modules/vault/hooks/useVault'
import colors from '@common/styles/colors'
import { isExtension } from '@web/constants/browserapi'
import { APPROVAL_REQUESTS_STORAGE_KEY } from '@web/contexts/approvalContext/types'
import { checkBrowserWindowsForExtensionPopup } from '@web/utils/checkBrowserWindowsForExtensionPopup'
import { getUiType } from '@web/utils/uiType'

import useWeb3Approval from './useWeb3Approval'

export interface RequestsContextReturnType {
  requests: any[]
  sentTxn: {
    confirmed: boolean
  }
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
  requestPendingState: React.MutableRefObject<boolean>
  setRequests: () => void
}

const RequestsContext = createContext<RequestsContextReturnType>({
  requests: [],
  sentTxn: {
    confirmed: false
  },
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
  onDismissSendTxns: () => {},
  requestPendingState: { current: false },
  setRequests: () => {}
})

const RequestsProvider: React.FC = ({ children }) => {
  const { accounts, selectedAcc } = useAccounts()
  const { network }: any = useNetwork()
  const { navigate } = useNavigation()
  const { path } = useRoute()
  const { vaultStatus } = useVault()
  const { addToast, addBottomSheet } = useToast()
  const { t } = useTranslation()
  const [allRequests, setRequests] = useState([])
  const [sendTxnBottomSheetBackdropPressedUniqueId, setSendTxnBottomSheetBackdropPressedUniqueId] =
    useState<any>(null)

  const { requests: gnosisRequests, resolveMany: gnosisResolveMany } = useGnosisSafe()
  const { requests: approvalRequests, resolveMany: approvalResolveMany } = useWeb3Approval()

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
  // Keeping track of sent transactions
  const [sentTxn, setSentTxn] = useState<any[]>([])

  // Keep track if we have a pending request in order to listen for it in portfolio
  // and display pending balance
  const requestPendingState = useRef(false)

  const addRequest = useCallback((req: any) => setRequests((reqs: any) => [...reqs, req]), [])

  // Filter all requests by dateAdded,
  // whether or not they are saved in local storage and add them on first render
  useEffect(() => {
    const storageRequests = [...gnosisRequests, ...approvalRequests]
    if (storageRequests.length) {
      const newRequests = storageRequests.sort((a, b) => a.dateAdded - b.dateAdded)
      setRequests((reqs) => [...reqs, ...newRequests])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const requests = useMemo(
    () => allRequests.filter(({ account }) => accounts.find(({ id }: any) => id === account)),
    [allRequests, accounts]
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
    showing: false
  }))

  const prevSendTxnState: any = usePrevious(sendTxnState)

  useEffect(() => {
    if (vaultStatus === VAULT_STATUS.UNLOCKED) {
      setSendTxnState((prev) => ({
        showing: !!eligibleRequests.length,
        // we only keep those if there are transactions, otherwise zero them
        replaceByDefault: eligibleRequests.length ? prev.replaceByDefault : null,
        mustReplaceNonce: eligibleRequests.length ? prev.mustReplaceNonce : null
      }))
    }
  }, [eligibleRequests.length, vaultStatus])

  const onBroadcastedTxn = useCallback(
    (hash: any) => {
      if (!hash) {
        addToast(t('Transaction signed but not broadcasted to the network!') as string, {
          timeout: 15000
        })
        return
      }
      setSentTxn((txn: any) => [...txn, { confirmed: false, hash }])
      addBottomSheet({
        text: t('You successfully signed and sent your transaction!'),
        buttonText: t('Woo-hoo!')
      })
    },
    [addBottomSheet, t, addToast]
  )

  const confirmSentTx = useCallback(
    (txHash: any) =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      setSentTxn((sentTxn) => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const tx = sentTxn.find((tx: any) => tx.hash === txHash)
        tx.confirmed = true
        requestPendingState.current = false
        // eslint-disable-next-line @typescript-eslint/no-shadow
        return [...sentTxn.filter((tx: any) => tx.hash !== txHash), tx]
      }),
    []
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resolveMany = useCallback(
    (ids: any, resolution: any) => {
      gnosisResolveMany(ids, resolution)
      approvalResolveMany(ids, resolution)
      setRequests((reqs: any) => reqs.filter((x: any) => !ids.includes(x.id)))
    },
    [gnosisResolveMany, approvalResolveMany]
  )

  const showSendTxns = useCallback(
    (replacementBundle: any, replaceByDefault = false) => {
      return setSendTxnState({ showing: true, replacementBundle, replaceByDefault })
    },
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
      const toSign = everythingToSign.filter((r) => r?.reqSrc !== APPROVAL_REQUESTS_STORAGE_KEY)

      if (toSign.length && vaultStatus === VAULT_STATUS.UNLOCKED) {
        navigate(ROUTES.signMessage)
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
      } else if (
        everythingToSign.filter((r) => r?.reqSrc === APPROVAL_REQUESTS_STORAGE_KEY).length &&
        (isiOS || isAndroid)
      ) {
        openBottomSheetSignMsg()
      }
    })()
  }, [everythingToSign, extensionWallet, vaultStatus, navigate, openBottomSheetSignMsg])

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
            (isiOS || isAndroid) &&
            path === `${MOBILE_ROUTES.web3Browser}-screen`
          ) {
            openBottomSheetSendTxn()
          } else {
            const shouldNavigateToPendingTransaction = ![
              // Skip navigating if user is in the middle of adding another acc
              `${MOBILE_ROUTES.auth}-screen`,
              `${MOBILE_ROUTES.ambireAccountJsonLogin}-screen`,
              `${MOBILE_ROUTES.ambireAccountLogin}-screen`,
              MOBILE_ROUTES.ambireAccountLoginPasswordConfirm,
              MOBILE_ROUTES.ambireAccountJsonLoginPasswordConfirm,
              MOBILE_ROUTES.hardwareWallet,
              MOBILE_ROUTES.externalSigner
            ].includes(path || '')

            if (shouldNavigateToPendingTransaction) {
              navigate(ROUTES.pendingTransactions)
            }
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
    openBottomSheetSendTxn,
    path
  ])

  return (
    <RequestsContext.Provider
      value={useMemo(
        () => ({
          requests,
          sentTxn,
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
          onDismissSendTxns,
          requestPendingState,
          setRequests
        }),
        [
          requests,
          sentTxn,
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
          onDismissSendTxns,
          requestPendingState,
          setRequests
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
        onBackdropPress={() => {
          // this func prevent the auto closing of the bottom sheet when the backdrop is pressed
          // instead it updates the value of setSendTxnBottomSheetBackdropPressedUniqueId with sth unique
          // to be handled in the PendingTransactionsProvider by comparing the new val with its prev val
          // and triggering the addToCart/Reject txn Bottom Sheet
          setSendTxnBottomSheetBackdropPressedUniqueId(new Date().getTime())
        }}
      >
        <PendingTransactionsProvider
          isInBottomSheet
          closeBottomSheetSendTxn={closeBottomSheetSendTxn}
          sendTxnBottomSheetBackdropPressedUniqueId={sendTxnBottomSheetBackdropPressedUniqueId}
        >
          <PendingTransactionsScreen isInBottomSheet closeBottomSheet={closeBottomSheetSendTxn} />
        </PendingTransactionsProvider>
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
