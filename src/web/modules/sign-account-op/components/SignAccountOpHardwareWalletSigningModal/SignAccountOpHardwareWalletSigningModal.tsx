import React, { useEffect, useMemo } from 'react'
import { View } from 'react-native'

import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Key } from '@ambire-common/interfaces/keystore'
import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import HardwareWalletSigningModal from '@web/modules/hardware-wallet/components/HardwareWalletSigningModal'
import { getUiType } from '@web/utils/uiType'

const { isPopup } = getUiType()

interface Props {
  signingKeyType?: AccountOp['signingKeyType']
  feePayerKeyType?: Key['type']
  isSignAndBroadcastInProgress: boolean
  signAccountOpStatusType?: SigningStatus
  shouldSignAuth: {
    type: 'V2Deploy' | '7702'
    text: string
  } | null
  signedTransactionsCount?: number | null
  accountOp: AccountOp
  actionType?: 'swapAndBridge' | 'transfer'
}

const SignAccountOpHardwareWalletSigningModal: React.FC<Props> = ({
  signingKeyType,
  feePayerKeyType,
  isSignAndBroadcastInProgress,
  signAccountOpStatusType,
  shouldSignAuth,
  signedTransactionsCount,
  accountOp,
  actionType
}: Props) => {
  const { dispatch: requestsCtrlDispatch } = useController('RequestsController')
  const { addToast } = useToast()

  const prevTransactionCount = usePrevious<number | null | undefined>(signedTransactionsCount)

  const shouldBeVisible = useMemo(() => {
    // we're not signing or broadcasting on paused updates
    if (signAccountOpStatusType === SigningStatus.UpdatesPaused) return false

    const isCurrentlyBroadcastingWithExternalKey =
      isSignAndBroadcastInProgress && !!feePayerKeyType && feePayerKeyType !== 'internal'
    const isCurrentlySigningWithExternalKey =
      signAccountOpStatusType === SigningStatus.InProgress &&
      !!signingKeyType &&
      signingKeyType !== 'internal'

    return isCurrentlyBroadcastingWithExternalKey || isCurrentlySigningWithExternalKey
  }, [isSignAndBroadcastInProgress, feePayerKeyType, signAccountOpStatusType, signingKeyType])

  const currentlyInvolvedSignOrBroadcastKeyType = useMemo(
    () => (signAccountOpStatusType === SigningStatus.InProgress ? signingKeyType : feePayerKeyType),
    [feePayerKeyType, signAccountOpStatusType, signingKeyType]
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

  if (!currentlyInvolvedSignOrBroadcastKeyType) return null

  return (
    <HardwareWalletSigningModal
      isVisible={shouldBeVisible}
      keyType={currentlyInvolvedSignOrBroadcastKeyType as 'trezor' | 'ledger' | 'lattice'}
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
