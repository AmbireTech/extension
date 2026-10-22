import React, { useEffect, useState } from 'react'
import { View } from 'react-native'

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
  activeSigningKeyType?: Key['type'] | null
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
  activeSigningKeyType,
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

  // The controller sets the active signing key type only while the flow is on
  // a key's signature, so the modal doesn't guess it from the signing status
  const shouldBeVisible = !!activeSigningKeyType && activeSigningKeyType !== 'internal'

  // Keep the last device after the controller clears the key type, so the
  // modal plays its closing animation instead of disappearing at once
  const [lastExternalKeyType, setLastExternalKeyType] = useState<Key['type'] | null>(null)
  if (shouldBeVisible && activeSigningKeyType !== lastExternalKeyType) {
    setLastExternalKeyType(activeSigningKeyType)
  }
  const displayedKeyType = shouldBeVisible ? activeSigningKeyType : lastExternalKeyType

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
    if (actionType && isPopup && activeSigningKeyType === 'trezor') {
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
  }, [actionType, activeSigningKeyType, requestsCtrlDispatch, accountOp.accountAddr])

  // Note: QR signing is handled by the QrSigningModal component and NFC card
  // signing by the NfcCardSessionModal, so this modal is not needed for either.
  if (!displayedKeyType || displayedKeyType === 'qr' || displayedKeyType === 'nfc') return null

  return (
    <HardwareWalletSigningModal
      isVisible={shouldBeVisible}
      keyType={displayedKeyType as ExternalKey['type']}
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
