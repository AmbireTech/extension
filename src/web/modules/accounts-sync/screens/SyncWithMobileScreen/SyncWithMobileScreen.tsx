import React, { useCallback } from 'react'
import { Image, ImageSourcePropType, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import ambireMobilePhoneMockup from '@common/assets/images/how-to-sync-on-mobile.png'

import AppStoreBadgeIcon from '@common/assets/svg/AppStoreBadgeIcon'
import GooglePlayBadgeIcon from '@common/assets/svg/GooglePlayBadgeIcon'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import Panel from '@common/components/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ACCOUNTS_SYNC_QR_CAPACITY } from '@common/modules/accounts-sync/consts'
import SelectAccountsToSyncSheet from '@common/modules/accounts-sync/components/SelectAccountsToSyncSheet'
import useAccountsSyncExport from '@common/modules/accounts-sync/hooks/useAccountsSyncExport'
import AnimatedQrCode from '@common/modules/hardware-wallets/components/AnimatedQrCode'
import { ACCOUNTS_SYNC_UR_TYPE } from '@ambire-common/libs/accountsSync/accountsSync'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

const QR_SIZE = 280
const PHONE_MOCKUP_HEIGHT = 300

const SyncWithMobileScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { navigate } = useNavigation()
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
  const { ref: sheetRef, open: openSelectSheet, close: closeSelectSheet } = useModalize()

  const [bindQrPlaceholderAnim, qrPlaceholderAnimStyle] = useCustomHover({
    property: 'opacity',
    values: { from: 1, to: 0.8 }
  })

  const handleConfirmSelection = useCallback(async () => {
    closeSelectSheet()
    await prepareExport()
  }, [closeSelectSheet, prepareExport])

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={() => navigate(WEB_ROUTES.accountSelect)}
          title={t('Sync with mobile')}
        >
          <ScrollableWrapper style={flexbox.flex1}>
            <Text fontSize={16} weight="medium" style={spacings.mbTy}>
              {t('1. Download Ambire Wallet mobile')}
            </Text>
            {/* Labels only - the store listings are not live yet */}
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
              <AppStoreBadgeIcon style={spacings.mrTy} />
              <GooglePlayBadgeIcon />
            </View>
            <Image
              source={ambireMobilePhoneMockup as ImageSourcePropType}
              style={{ width: '100%', height: PHONE_MOCKUP_HEIGHT }}
              resizeMode="contain"
            />

            <Text fontSize={16} weight="medium" style={[spacings.mtLg, spacings.mbTy]}>
              {t('2. Scan with Ambire Wallet mobile')}
            </Text>
            <Text fontSize={14} appearance="secondaryText" style={spacings.mbSm}>
              {t(
                'The QR codes contain your accounts and their keys. Show them to your phone only, never to anyone else.'
              )}
            </Text>

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
                    height: QR_SIZE,
                    borderRadius: BORDER_RADIUS_PRIMARY,
                    backgroundColor: theme.tertiaryBackground
                  }
                ]}
                {...bindQrPlaceholderAnim}
              >
                <InvisibilityIcon color={theme.primaryText} width={32} height={32} />
                <Text fontSize={14} weight="medium" style={[spacings.mtSm, text.center]}>
                  {isPreparing
                    ? t('Preparing the QR codes...')
                    : t('Click to select accounts and show QR codes')}
                </Text>
              </AnimatedPressable>
            )}
          </ScrollableWrapper>
        </Panel>
      </TabLayoutWrapperMainContent>

      <SelectAccountsToSyncSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeSelectSheet}
        accounts={accounts}
        selectedAddrs={selectedAddrs}
        areAllSelected={areAllSelected}
        onToggleAccount={toggleAccount}
        onToggleAllAccounts={toggleAllAccounts}
        onConfirm={handleConfirmSelection}
        isConfirmDisabled={isPreparing}
      />
    </TabLayoutContainer>
  )
}

export default React.memo(SyncWithMobileScreen)
