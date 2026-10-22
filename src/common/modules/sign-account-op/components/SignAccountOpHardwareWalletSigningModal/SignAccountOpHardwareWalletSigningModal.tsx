import React, { useEffect, useMemo } from 'react'
import { View } from 'react-native'

import { SigningStatus } from '@ambire-common/interfaces/signAccountOp'
import { ExternalKey, Key } from '@ambire-common/interfaces/keystore'
import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import useToast from '@common/hooks/useToast'
import HardwareWalletSigningModal from '@common/modules/hardware-wallets/components/HardwareWalletSigningModal'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isPopup } = getUiType()

interface Props {
  signingKeyType?: AccountOp['signingKeyType']
  feePayerKeyType?: Key['type'] | null
  isSignAndBroadcastInProgress: boolean
  signAccountOpStatusType?: SigningStatus
  shouldSignAuth: {
    type: 'V2Deploy' | '7702'
    text: string
  } | null
  signedTransactionsCount?: number | null
  accountOp: AccountOp
  actionType?: 'swapAndBridge' | 'transfer'
  cancelReq?: () => void
  hardwareWalletSigningRequest?: HardwareWalletSigningRequest | null
}

const SignAccountOpHardwareWalletSigningModal: React.FC<Props> = ({
  signingKeyType,
  feePayerKeyType,
  isSignAndBroadcastInProgress,
  signAccountOpStatusType,
  shouldSignAuth,
  signedTransactionsCount,
  accountOp,
  actionType,
  cancelReq,
  hardwareWalletSigningRequest
}: Props) => {
  const { dispatch: requestsCtrlDispatch } = useController('RequestsController')
  const { addToast } = useToast()

  const prevTransactionCount = usePrevious<number | null | undefined>(signedTransactionsCount)

  // The signing key may be used while the status is InProgress, but not every
  // InProgress reaches the device (e.g. a fully signed Safe that is only executed).
  // WaitingForPaymaster isn't listed because useSign renders the warnings modal
  // instead of this one while the paymaster is loading.
  // SafeQuickBroadcastBundler sits between the two sign() calls of a Safe quick
  // broadcast - treating it as signing keeps the modal from hiding and reappearing,
  // even though the second sign() reuses the Safe signature without the device
  const isSigningPhase =
    signAccountOpStatusType === SigningStatus.InProgress ||
    (isSignAndBroadcastInProgress &&
      signAccountOpStatusType === SigningStatus.SafeQuickBroadcastBundler)
  // The fee payer key can only be used after signing is Done and the broadcast begins,
  // and only by raw-transaction broadcasts (bundler and relayer broadcasts don't use it).
  // Before that, the flow may never reach broadcasting (e.g. a Safe txn that still
  // needs more signatures gets queued), so the fee payer's modal must not show.
  const isBroadcastPhase =
    isSignAndBroadcastInProgress && signAccountOpStatusType === SigningStatus.Done

  const isCurrentlyBroadcastingWithExternalKey =
    isBroadcastPhase && !!feePayerKeyType && feePayerKeyType !== 'internal'
  const isCurrentlySigningWithExternalKey =
    isSigningPhase && !!signingKeyType && signingKeyType !== 'internal'
  const shouldBeVisible =
    isCurrentlyBroadcastingWithExternalKey || isCurrentlySigningWithExternalKey

  const currentlyInvolvedSignOrBroadcastKeyType = useMemo(
    () => (isSigningPhase ? signingKeyType : feePayerKeyType),
    [feePayerKeyType, isSigningPhase, signingKeyType]
  )

  useEffect(() => {
    const isSigningOneOfMultipleAsEoa = typeof signedTransactionsCount === 'number'

    if (!isSigningOneOfMultipleAsEoa) return

    const hasJustSigned = signedTransactionsCount > (prevTransactionCount || 0)

    if (hasJustSigned) {
      const hasSignedLast = signedTransactionsCount === accountOp?.calls.length

      addToast(
        `Transaction ${signedTransactionsCount} / ${accountOp?.calls.length} signed! ${
          hasSignedLast ? 'Broadcasting...' : 'Sending next...'
        }`
      )
    }
  }, [accountOp?.calls.length, addToast, prevTransactionCount, signedTransactionsCount])

  useEffect(() => {
    if (
      shouldBeVisible &&
      actionType &&
      isPopup &&
      currentlyInvolvedSignOrBroadcastKeyType === 'trezor'
    ) {
      const idSuffix = actionType === 'swapAndBridge' ? 'swap-and-bridge-sign' : 'transfer-sign'

      // If the user needs to sign using a hardware wallet, we need to open the
      // screen in an request window and close the popup
      requestsCtrlDispatch({
        type: 'method',
        params: {
          method: 'addUserRequests',
          args: [
            [
              {
                id: `${accountOp.accountAddr}-${idSuffix}`,
                kind: actionType,
                meta: {
                  accountAddr: accountOp.accountAddr
                },
                dappPromises: []
              }
            ],
            {
              position: 'last',
              executionType: 'open-request-window'
            }
          ]
        }
      })
      window.close()
    }
  }, [
    actionType,
    currentlyInvolvedSignOrBroadcastKeyType,
    requestsCtrlDispatch,
    shouldBeVisible,
    accountOp.accountAddr
  ])

  // Note: QR signing is handled by the QrSigningModal component and NFC card
  // signing by the NfcCardSessionModal, so this modal is not needed for either.
  if (
    !currentlyInvolvedSignOrBroadcastKeyType ||
    currentlyInvolvedSignOrBroadcastKeyType === 'qr' ||
    currentlyInvolvedSignOrBroadcastKeyType === 'nfc'
  )
    return null

  return (
    <HardwareWalletSigningModal
      isVisible={shouldBeVisible}
      keyType={currentlyInvolvedSignOrBroadcastKeyType as ExternalKey['type']}
      cancelReq={cancelReq}
      signingRequest={hardwareWalletSigningRequest}
    >
      {typeof signedTransactionsCount === 'number' ? (
        <View style={[flexbox.alignCenter, flexbox.justifyCenter, spacings.ptLg]}>
          <Text weight="medium" fontSize={16}>
            {signedTransactionsCount} / {accountOp?.calls.length}{' '}
            {signedTransactionsCount === 1 ? 'transaction' : 'transactions'} signed
          </Text>
        </View>
      ) : null}

      {shouldSignAuth ? (
        <View style={[flexbox.alignCenter, flexbox.justifyCenter, spacings.ptLg]}>
          <Text weight="medium" fontSize={16}>
            {shouldSignAuth.text}
          </Text>
        </View>
      ) : null}
    </HardwareWalletSigningModal>
  )
}

export default React.memo(SignAccountOpHardwareWalletSigningModal)
