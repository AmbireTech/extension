import React, { useCallback, useMemo } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { ACCOUNTS_SYNC_UR_TYPE } from '@ambire-common/libs/accountsSync/accountsSync'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
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
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { openInTab } from '@common/utils/links'

const MAX_QR_SIZE = 400
// Small phones can't fit the whole sheet content, so the warning is dropped there
// to keep the QR code and the account selection visible without scrolling.
const SHORT_SCREEN_HEIGHT = 700

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
  const { theme, themeType } = useTheme()
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()

  // Stretch the QR to the full width available inside the sheet (which is padded
  // by SPACING_SM on both sides), but cap it on larger devices so it stays centered.
  const qrSize = useMemo(() => Math.min(windowWidth - SPACING_SM * 2, MAX_QR_SIZE), [windowWidth])

  // The sheet background is already white on the light theme, so the QR's own white
  // quiet zone is invisible there - drop it and let the code fill that space instead.
  const qrQuietZone = themeType === THEME_TYPES.LIGHT ? 0 : undefined

  const handleOpenLink = useCallback(
    () => openInTab({ url: `https://${GET_AMBIRE_EXTENSION_LINK}` }),
    []
  )

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
        <ModalHeader handleClose={closeBottomSheet} title={t('Export accounts')} />
        <Text fontSize={16} weight="medium" style={spacings.mbTy}>
          {t('1. Download the Ambire Extension on your browser.')}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb]}>
          <Text fontSize={14} appearance="secondaryText" style={spacings.mrTy}>
            {t('Visit')}
            {': '}
            <Text fontSize={14} appearance="secondaryText" underline onPress={handleOpenLink}>
              {GET_AMBIRE_EXTENSION_LINK}
            </Text>
          </Text>
          <CopyText
            text={GET_AMBIRE_EXTENSION_LINK}
            iconColor={theme.secondaryText}
            iconSize={20}
          />
        </View>

        <Text fontSize={16} weight="medium" style={spacings.mbTy}>
          {t("2. Scan using your computer's camera")}
        </Text>

        {qrCbor ? (
          <View style={flexbox.alignCenter}>
            <AnimatedQrCode
              type={ACCOUNTS_SYNC_UR_TYPE}
              cbor={qrCbor}
              size={qrSize}
              capacity={ACCOUNTS_SYNC_QR_CAPACITY}
              quietZone={qrQuietZone}
            />
            {windowHeight >= SHORT_SCREEN_HEIGHT && (
              <Alert
                type="info"
                size="sm"
                style={{ ...spacings.mtSm, ...spacings.pvTy }}
                title={t(
                  'Your QR codes include sensitive information. Do not share them with anyone.'
                )}
              />
            )}
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
                height: qrSize,
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
