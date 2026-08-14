import React, { useCallback, useMemo } from 'react'
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import QRCode from 'react-native-qrcode-svg'

import ambireMobilePhoneMockup from '@common/assets/images/how-to-sync-on-mobile.png'

import { ACCOUNTS_SYNC_UR_TYPE } from '@ambire-common/libs/accountsSync/accountsSync'
import AppStoreBadgeIcon from '@common/assets/svg/AppStoreBadgeIcon'
import GooglePlayBadgeIcon from '@common/assets/svg/GooglePlayBadgeIcon'
import ShieldInvisibilityIcon from '@common/assets/svg/ShieldInvisibilityIcon'
import Alert from '@common/components/Alert'
import Panel from '@common/components/Panel'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import SelectAccountsToSyncSheet from '@common/modules/accounts-sync/components/SelectAccountsToSyncSheet'
import { ACCOUNTS_SYNC_QR_CAPACITY } from '@common/modules/accounts-sync/consts'
import useAccountsSyncExport from '@common/modules/accounts-sync/hooks/useAccountsSyncExport'
import AnimatedQrCode from '@common/modules/hardware-wallets/components/AnimatedQrCode'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_LG, SPACING_SM, SPACING_XL } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

import getStyles from './styles'

const PANEL_WIDTH = 400
// `spacingsSize="small"` pads the panel by this much on both sides, so the QR code and its
// placeholder fill the card the way they fill the sheet on mobile
const QR_SIZE = PANEL_WIDTH - SPACING_LG * 2
const PHONE_MOCKUP_HEIGHT = 300
// The two steps keep the same vertical rhythm, so the store buttons line up with the
// warning and the phone mockup with the QR code. Both are the height of the taller side:
// the back button for the titles, a store tile for the row under them.
const TITLE_ROW_HEIGHT = 28
const SECOND_ROW_MIN_HEIGHT = 52
// Dummy value rendered behind the scrim before the accounts are picked, so the
// placeholder hints at a QR code instead of showing a flat empty box.
const PLACEHOLDER_QR_VALUE = '0123456789ABCDEF'.repeat(24)

const SyncWithMobileScreen = () => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { navigate, goBack, canGoBack } = useNavigation()
  const { minHeightSize } = useWindowSize()
  const {
    accounts,
    selectedAddrs,
    areAllSelected,
    selectedSeedsCount,
    includeSeeds,
    toggleIncludeSeeds,
    toggleAccount,
    toggleAllAccounts,
    prepareExport,
    isPreparing,
    qrCbor
  } = useAccountsSyncExport()
  const { ref: sheetRef, open: openSelectSheet, close: closeSelectSheet } = useModalize()

  const [bindQrPlaceholderAnim, qrPlaceholderAnimStyle] = useCustomHover({
    property: 'opacity',
    values: { from: 1, to: 0.8 }
  })

  const handleConfirmSelection = useCallback(async () => {
    closeSelectSheet()
    await prepareExport()
  }, [closeSelectSheet, prepareExport])

  // Going back instead of navigating, so the screen the user came from doesn't end up with
  // this one still ahead of it in the history. There is nothing to go back to when the
  // route was opened in a fresh tab.
  const handleBackButtonPress = useCallback(() => {
    if (canGoBack) return goBack()

    navigate(WEB_ROUTES.accountSelect)
  }, [canGoBack, goBack, navigate])

  // `TabLayoutWrapperMainContent` applies this to the onboarding routes only, and the
  // export is not one of them, so the panels sit where the onboarding ones do
  const contentContainerStyle = useMemo(
    () => (minHeightSize('xl') ? spacings.pv : spacings.pt2Xl),
    [minHeightSize]
  )

  // A filled tile rather than a border, which `secondaryBorder` makes invisible on the
  // white card of the light theme
  const storeBadgeStyle = {
    ...flexbox.flex1,
    ...flexbox.center,
    ...spacings.pvSm,
    backgroundColor: theme.secondaryBackground,
    borderRadius: BORDER_RADIUS_PRIMARY
  }

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground} width="lg">
      <TabLayoutWrapperMainContent withScroll={false} contentContainerStyle={contentContainerStyle}>
        {/* The two steps are separate cards next to each other, so neither of them scrolls */}
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignSelfCenter,
            { columnGap: SPACING_XL, maxWidth: PANEL_WIDTH * 2 + SPACING_XL }
          ]}
        >
          <Panel
            type="onboarding"
            spacingsSize="small"
            panelWidth={PANEL_WIDTH}
            style={flexbox.flex1}
          >
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                spacings.mbLg,
                { height: TITLE_ROW_HEIGHT }
              ]}
            >
              <PanelBackButton onPress={handleBackButtonPress} />
              <PanelTitle title={t('1. Download Ambire Wallet mobile')} size={16} />
              <View style={{ width: 20 }} />
            </View>
            {/* Labels only - the store listings are not live yet */}
            <View
              style={[
                flexbox.directionRow,
                flexbox.justifyCenter,
                spacings.mbLg,
                { columnGap: SPACING_SM, minHeight: SECOND_ROW_MIN_HEIGHT }
              ]}
            >
              <View style={storeBadgeStyle}>
                <AppStoreBadgeIcon />
              </View>
              <View style={storeBadgeStyle}>
                <GooglePlayBadgeIcon />
              </View>
            </View>
            <Image
              source={ambireMobilePhoneMockup as ImageSourcePropType}
              style={{ flex: 1, width: '100%', minHeight: PHONE_MOCKUP_HEIGHT }}
              resizeMode="contain"
            />
          </Panel>

          <Panel
            type="onboarding"
            spacingsSize="small"
            panelWidth={PANEL_WIDTH}
            style={flexbox.flex1}
          >
            {/* `PanelTitle` carries `flex: 1`, which stretches it down the whole card
            unless it sits in a row of its own */}
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                spacings.mbLg,
                { height: TITLE_ROW_HEIGHT }
              ]}
            >
              <PanelTitle title={t('2. Scan with Ambire Wallet mobile')} size={16} />
            </View>
            <View
              style={[flexbox.justifyCenter, spacings.mbLg, { minHeight: SECOND_ROW_MIN_HEIGHT }]}
            >
              <Alert
                testID="sync-qr-warning"
                type="info"
                size="sm"
                title={t(
                  'Your QR code includes sensitive information. Do not share it with anyone.'
                )}
              />
            </View>

            {qrCbor ? (
              <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
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
                    onPress={openSelectSheet as any}
                    color={theme.primary}
                  >
                    {t('Edit')}
                  </Text>{' '}
                  {t('your selection')}
                </Text>
              </View>
            ) : (
              <AnimatedPressable
                testID="show-sync-qr-code"
                onPress={openSelectSheet as any}
                disabled={isPreparing}
                style={[
                  flexbox.center,
                  qrPlaceholderAnimStyle,
                  {
                    // Square and as wide as the QR code it stands in for
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: BORDER_RADIUS_PRIMARY,
                    overflow: 'hidden',
                    backgroundColor: theme.tertiaryBackground
                  }
                ]}
                {...bindQrPlaceholderAnim}
              >
                <View
                  style={[StyleSheet.absoluteFill, flexbox.center, styles.blurredPlaceholderQr]}
                  pointerEvents="none"
                >
                  <QRCode value={PLACEHOLDER_QR_VALUE} size={QR_SIZE} quietZone={0} ecl="L" />
                </View>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: theme.backdrop }]}
                  pointerEvents="none"
                />
                {/* An `<svg>` is not positioned, so the absolutely positioned layers above
                would paint over the icon without a wrapper of its own to lift it */}
                <View style={[flexbox.center, spacings.phXl, { zIndex: 1 }]}>
                  <ShieldInvisibilityIcon color={theme.neutral200} width={44} height={50} />
                  <Text
                    fontSize={14}
                    weight="medium"
                    color={theme.neutral200}
                    style={[spacings.mtSm, text.center]}
                  >
                    {isPreparing
                      ? t('Preparing the QR codes...')
                      : t('Click to select accounts and show QR codes')}
                  </Text>
                </View>
              </AnimatedPressable>
            )}
          </Panel>
        </View>
      </TabLayoutWrapperMainContent>

      <SelectAccountsToSyncSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeSelectSheet}
        accounts={accounts}
        selectedAddrs={selectedAddrs}
        areAllSelected={areAllSelected}
        selectedSeedsCount={selectedSeedsCount}
        includeSeeds={includeSeeds}
        onToggleIncludeSeeds={toggleIncludeSeeds}
        onToggleAccount={toggleAccount}
        onToggleAllAccounts={toggleAllAccounts}
        onConfirm={handleConfirmSelection}
        isConfirmDisabled={isPreparing}
      />
    </TabLayoutContainer>
  )
}

export default React.memo(SyncWithMobileScreen)
