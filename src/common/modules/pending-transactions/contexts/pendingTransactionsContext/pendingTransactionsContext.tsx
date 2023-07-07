import usePrevious from 'ambire-common/src/hooks/usePrevious'
import React, { Dispatch, useEffect, useMemo, useRef } from 'react'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useSendTransaction from '@common/modules/pending-transactions/hooks/useSendTransaction'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import HardwareWalletSelectConnection from '@mobile/modules/hardware-wallet/components/HardwareWalletSelectConnection'

type PendingTransactionsContextProps = {
  sendTxnBottomSheetBackdropPressedUniqueId: any
  children: any
  isInBottomSheet?: boolean
  closeBottomSheetSendTxn: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

type PendingTransactionsContextData = {
  preventNavToDashboard: React.MutableRefObject<boolean>
  transaction: {
    bundle: any
    estimation: any
    signingStatus: any
    feeSpeed: any
    canProceed: boolean | null
    mustReplaceNonce: any
    replaceTx: boolean
    rejectTxn: () => void
    setReplaceTx: React.Dispatch<React.SetStateAction<boolean>>
    approveTxn: ({ code, device }: { code?: string; device?: any }) => Promise<void>
    setFeeSpeed: Dispatch<any>
    setEstimation: Dispatch<any>
    setSigningStatus: Dispatch<any>
    rejectTxnReplace: () => void
  }
  rejectTxnOpenBottomSheet: (dest?: 'default' | 'top' | undefined) => void
  rejectTxnCloseBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
  hardwareWalletOpenBottomSheet: (dest?: 'default' | 'top' | undefined) => void
  hardwareWalletCloseBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

const PendingTransactionsContext = React.createContext<PendingTransactionsContextData>({
  preventNavToDashboard: { current: false },
  // @ts-ignore
  transaction: {},
  rejectTxnOpenBottomSheet: () => {},
  rejectTxnCloseBottomSheet: () => {},
  hardwareWalletOpenBottomSheet: () => {},
  hardwareWalletCloseBottomSheet: () => {}
})

const PendingTransactionsProvider = ({
  children,
  isInBottomSheet,
  sendTxnBottomSheetBackdropPressedUniqueId = null,
  closeBottomSheetSendTxn
}: PendingTransactionsContextProps) => {
  const { t } = useTranslation()
  const { goBack } = useNavigation()
  const preventNavToDashboard = useRef(false)
  const prevSendTxnBottomSheetBackdropPressedUniqueId = usePrevious(
    sendTxnBottomSheetBackdropPressedUniqueId
  )

  const {
    ref: hardwareWalletSheetRef,
    open: hardwareWalletOpenBottomSheet,
    close: hardwareWalletCloseBottomSheet
  } = useModalize()

  const {
    ref: rejectTxnSheetRef,
    open: rejectTxnOpenBottomSheet,
    close: rejectTxnCloseBottomSheet
  } = useModalize()

  // each time the sendTxnBottomSheetBackdropPressedUniqueId is changed trigger the rejectTxnOpenBottomSheet
  // when the backdrop of the bottom sheet is pressed the sendTxnBottomSheetBackdropPressedUniqueId will be updated so each update is unique value
  // and therefore triggers an update here
  useEffect(() => {
    if (
      !!sendTxnBottomSheetBackdropPressedUniqueId &&
      isInBottomSheet &&
      prevSendTxnBottomSheetBackdropPressedUniqueId !== sendTxnBottomSheetBackdropPressedUniqueId
    ) {
      rejectTxnOpenBottomSheet()
    }
  }, [
    prevSendTxnBottomSheetBackdropPressedUniqueId,
    sendTxnBottomSheetBackdropPressedUniqueId,
    rejectTxnOpenBottomSheet,
    isInBottomSheet
  ])

  const transaction = useSendTransaction({
    hardwareWalletOpenBottomSheet
  })

  return (
    <PendingTransactionsContext.Provider
      value={useMemo(
        () => ({
          transaction,
          preventNavToDashboard,
          rejectTxnOpenBottomSheet,
          rejectTxnCloseBottomSheet,
          hardwareWalletOpenBottomSheet,
          hardwareWalletCloseBottomSheet
        }),
        [
          transaction,
          rejectTxnOpenBottomSheet,
          rejectTxnCloseBottomSheet,
          hardwareWalletOpenBottomSheet,
          hardwareWalletCloseBottomSheet
        ]
      )}
    >
      {children}
      <BottomSheet
        id="close-txn-bottom-sheet"
        sheetRef={rejectTxnSheetRef}
        closeBottomSheet={() => {
          rejectTxnCloseBottomSheet()
        }}
        cancelText={t('Reject')}
        cancelTextStyles={{
          textDecorationLine: 'underline',
          color: colors.pink
        }}
        cancelOnPress={() => {
          preventNavToDashboard.current = true
          transaction.rejectTxn()
          isInBottomSheet && closeBottomSheetSendTxn()
        }}
      >
        <Text style={spacings.pv} fontSize={16} weight="regular">
          {t(
            'You can add more transactions to your cart and sign them all together (thus saving on network fees).'
          )}
        </Text>
        <Text fontSize={16} weight="regular" style={[spacings.pbTy, spacings.mbLg]}>
          {t('Alternatively, you can reject transaction.')}
        </Text>
        <Button
          text={t('Add to cart')}
          type="outline"
          onPress={() => {
            if (isInBottomSheet) {
              closeBottomSheetSendTxn()
            } else {
              goBack()
            }
          }}
        />
      </BottomSheet>

      <BottomSheet
        id="pending-transactions-hardware-wallet"
        sheetRef={hardwareWalletSheetRef}
        closeBottomSheet={() => {
          hardwareWalletCloseBottomSheet()
        }}
      >
        <HardwareWalletSelectConnection
          onSelectDevice={(device: any) => {
            transaction.approveTxn({ device })
            hardwareWalletCloseBottomSheet()
          }}
          shouldWrap={false}
        />
      </BottomSheet>
    </PendingTransactionsContext.Provider>
  )
}

export { PendingTransactionsContext, PendingTransactionsProvider }
