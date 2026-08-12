import React, { useCallback } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { ACCOUNTS_SYNC_UR_TYPE } from '@ambire-common/libs/accountsSync/accountsSync'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import CopyText from '@common/components/CopyText'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import SelectAccountsToSyncSheet from '@common/modules/accounts-sync/components/SelectAccountsToSyncSheet'
import {
  ACCOUNTS_SYNC_QR_CAPACITY,
  GET_AMBIRE_EXTENSION_LINK
} from '@common/modules/accounts-sync/consts'
import useAccountsSyncExport from '@common/modules/accounts-sync/hooks/useAccountsSyncExport'
import AnimatedQrCode from '@common/modules/hardware-wallets/components/AnimatedQrCode'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

const QR_SIZE = 280

interface Props {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
}

/**
 * Shows the accounts the user picked as animated QR codes, for the Ambire extension to
 * scan with the computer's camera.
 */
const ExportToExtensionSheet = ({ sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    accounts,
    selectedAddrs,
    areAllSelected,
    toggleAccount,
    toggleAllAccounts,
    prepareExport,
    isPreparing,
    qrCbor
  } = useAccountsSyncExport()
  const { ref: selectSheetRef, open: openSelectSheet, close: closeSelectSheet } = useModalize()
  const [bindPlaceholderAnim, placeholderAnimStyle] = useHover({ preset: 'opacityInverted' })

  const handleConfirmSelection = useCallback(async () => {
    closeSelectSheet()
    await prepareExport()
  }, [closeSelectSheet, prepareExport])

  return (
    <>
      <BottomSheet
        id="export-accounts-to-extension"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
      >
        <Text fontSize={16} weight="medium" style={spacings.mbTy}>
          {t('1. Download the Ambire Extension on your browser.')}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
          <Text fontSize={14} appearance="secondaryText" style={spacings.mrTy}>
            {t('Visit: {{link}}', { link: GET_AMBIRE_EXTENSION_LINK })}
          </Text>
          <CopyText
            text={GET_AMBIRE_EXTENSION_LINK}
            iconColor={theme.secondaryText}
            iconSize={16}
          />
        </View>

        <Text fontSize={16} weight="medium" style={spacings.mbTy}>
          {t("2. Scan using your computer's camera")}
        </Text>
        <Alert
          type="info"
          size="sm"
          style={spacings.mbSm}
          title={t('Your QR codes include sensitive information. Do not share them with anyone.')}
        />

        {qrCbor ? (
          <View style={flexbox.alignCenter}>
            <AnimatedQrCode
              type={ACCOUNTS_SYNC_UR_TYPE}
              cbor={qrCbor}
              size={QR_SIZE}
              capacity={ACCOUNTS_SYNC_QR_CAPACITY}
            />
            <Text fontSize={14} appearance="secondaryText" style={spacings.mtSm}>
              {t('{{count}} account{{s}} selected.', {
                count: selectedAddrs.length,
                s: selectedAddrs.length > 1 ? 's' : ''
              })}{' '}
              <Text
                fontSize={14}
                weight="medium"
                underline
                color={theme.primary}
                onPress={openSelectSheet as any}
              >
                {t('Edit')}
              </Text>{' '}
              {t('your selection')}
            </Text>
          </View>
        ) : (
          <AnimatedPressable
            testID="show-sync-qr-codes"
            onPress={openSelectSheet as any}
            disabled={isPreparing}
            style={[
              flexbox.center,
              placeholderAnimStyle,
              {
                height: QR_SIZE,
                borderRadius: BORDER_RADIUS_PRIMARY,
                backgroundColor: theme.tertiaryBackground
              }
            ]}
            {...bindPlaceholderAnim}
          >
            <InvisibilityIcon color={theme.primaryText} width={32} height={32} />
            <Text fontSize={14} weight="medium" style={[spacings.mtSm, text.center]}>
              {isPreparing
                ? t('Preparing the QR codes...')
                : t('Tap to select accounts and show QR codes')}
            </Text>
          </AnimatedPressable>
        )}
      </BottomSheet>

      <SelectAccountsToSyncSheet
        sheetRef={selectSheetRef}
        closeBottomSheet={closeSelectSheet}
        accounts={accounts}
        selectedAddrs={selectedAddrs}
        areAllSelected={areAllSelected}
        onToggleAccount={toggleAccount}
        onToggleAllAccounts={toggleAllAccounts}
        onConfirm={handleConfirmSelection}
        isConfirmDisabled={isPreparing}
      />
    </>
  )
}

export default React.memo(ExportToExtensionSheet)
