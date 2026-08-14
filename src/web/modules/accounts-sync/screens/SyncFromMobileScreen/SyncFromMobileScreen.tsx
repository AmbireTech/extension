import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ImageSourcePropType, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import scanQrCodes from '@common/assets/images/scan-qr-codes.png'
import syncStepsOnTheMobile from '@common/assets/images/sync-steps-on-the-mobile.gif'
import SyncIcon from '@common/assets/svg/SyncIcon'
import Alert from '@common/components/Alert'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import SyncImportSteps, {
  SyncImportStep,
  SyncImportStepsFooter
} from '@common/modules/accounts-sync/components/SyncImportSteps'
import useAccountsSyncImport from '@common/modules/accounts-sync/hooks/useAccountsSyncImport'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import common, { BORDER_RADIUS_SECONDARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import QrScannerWithPermission from '@web/modules/hardware-wallet/screens/QrScannerWithPermission'
import BottomSheetPasswordConfirmation from '@web/modules/settings/components/BottomSheetPasswordConfirmation'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const SCANNER_SIZE = 290
// The asset is delivered at twice this size, so it stays sharp on dense screens
const SCAN_ILLUSTRATION_SIZE = 236
// The illustrations differ in height, so the card behind them is fixed to keep the panel
// exactly as tall on every step
const ILLUSTRATION_CARD_HEIGHT = 300
// The scanner is shorter than the steps, so the panel is kept as tall as the steps make
// it, no matter which of the two is on screen
const PANEL_HEIGHT = 620
const ANIMATION_HEIGHT = ILLUSTRATION_CARD_HEIGHT - SPACING_LG * 2
const ANIMATION_ASPECT_RATIO = 374 / 664

const selectHasPasswordSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.hasPasswordSecret
const selectAccountsCount = (state: AllControllersMappingType['AccountsController']) =>
  state.accounts.length

const SyncFromMobileScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { navigate, goBack, canGoBack } = useNavigation()
  const { state: hasPasswordSecret } = useController('KeystoreController', selectHasPasswordSecret)
  const { state: accountsCount } = useController('AccountsController', selectAccountsCount)
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const {
    ref: passwordSheetRef,
    open: openPasswordSheet,
    close: closePasswordSheet
  } = useModalize()
  const [isScanning, setIsScanning] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const steps: SyncImportStep[] = useMemo(
    () => [
      {
        id: 'steps-on-mobile',
        illustration: (
          // The animation is a screenshot of the mobile app, so it gets the rounded
          // corners and the drop shadow of a device floating above the card
          <View
            style={{
              ...common.shadowPrimary,
              ...flexbox.alignSelfCenter,
              borderRadius: BORDER_RADIUS_SECONDARY,
              backgroundColor: theme.primaryBackground
            }}
          >
            <Image
              source={syncStepsOnTheMobile as ImageSourcePropType}
              resizeMode="contain"
              style={{
                width: ANIMATION_HEIGHT * ANIMATION_ASPECT_RATIO,
                height: ANIMATION_HEIGHT,
                borderRadius: BORDER_RADIUS_SECONDARY
              }}
            />
          </View>
        ),
        content: (
          <>
            <Text fontSize={14} weight="medium" appearance="secondaryText">
              {t('1. Find "Sync with extension" in the Accounts section on the Ambire mobile app.')}
            </Text>
            <Text fontSize={14} weight="medium" appearance="secondaryText">
              {t('2. Click on "Export to extension".')}
            </Text>
          </>
        )
      },
      {
        id: 'scan-qr-codes',
        illustration: (
          <Image
            source={scanQrCodes as ImageSourcePropType}
            resizeMode="contain"
            style={{ width: SCAN_ILLUSTRATION_SIZE, height: SCAN_ILLUSTRATION_SIZE }}
          />
        ),
        content: (
          <Text fontSize={14} weight="medium" appearance="secondaryText">
            {t(
              "Scan the QR codes with your computer's camera to sync the accounts. Hold your phone still until the process is complete."
            )}
          </Text>
        )
      }
    ],
    [t, theme]
  )

  const handleImported = useCallback(() => {
    closePasswordSheet()
    // During onboarding the accounts arrive before this device has a password of its
    // own, so setting one comes next. Otherwise the freshly imported accounts can be
    // named right away. Both are onboarding routes reachable through internal navigation
    // only, so going there with `navigate` gets bounced back to this screen.
    goToNextRoute(hasPasswordSecret ? WEB_ROUTES.accountPersonalize : WEB_ROUTES.keyStoreSetup)
  }, [closePasswordSheet, goToNextRoute, hasPasswordSecret])

  const {
    handleScanComplete,
    hasScannedPayload,
    scannedAccounts,
    scanError,
    retryScan,
    importScannedAccounts,
    isImporting
  } = useAccountsSyncImport({ onImported: handleImported })

  useEffect(() => {
    if (hasScannedPayload) openPasswordSheet()
  }, [hasScannedPayload, openPasswordSheet])

  const handleBackButtonPress = useCallback(() => {
    // The scanner is a step of this screen, so going back returns to the instructions
    if (isScanning) return setIsScanning(false)

    // Same for the instructions themselves, which are a couple of steps
    if (stepIndex) return setStepIndex(stepIndex - 1)

    // Without accounts this is the onboarding flow, which came from the get started screen
    if (!accountsCount) return goToPrevRoute()

    // Going back instead of navigating, so the screen the user came from doesn't end up
    // with this one still ahead of it in the history. There is nothing to go back to when
    // the route was opened in a fresh tab.
    if (canGoBack) return goBack()

    navigate(WEB_ROUTES.accountSelect)
  }, [accountsCount, canGoBack, goBack, goToPrevRoute, isScanning, navigate, stepIndex])

  // Closing the sheet without entering the password means scanning again
  const handleClosePasswordSheet = useCallback(() => {
    closePasswordSheet()
    retryScan()
  }, [closePasswordSheet, retryScan])

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={handleBackButtonPress}
          title={t('Import from mobile')}
          titleContainerStyle={spacings.mb}
          style={{ minHeight: PANEL_HEIGHT }}
        >
          {isScanning ? (
            <>
              <Text
                fontSize={14}
                weight="medium"
                appearance="secondaryText"
                style={[text.center, spacings.mbLg]}
              >
                {t('Scan the QR codes generated on your Ambire mobile app.')}
              </Text>
              {/* The scanner takes the panel's free space, so the alert stays at the
              bottom of the card, where the button of the steps is */}
              <View style={flexbox.flex1}>
                <View
                  style={[
                    flexbox.alignSelfCenter,
                    { width: SCANNER_SIZE, height: SCANNER_SIZE, overflow: 'hidden' }
                  ]}
                >
                  <QrScannerWithPermission
                    onComplete={handleScanComplete}
                    disabled={hasScannedPayload || isImporting}
                    externalError={scanError}
                    onExternalRetry={retryScan}
                  />
                </View>
              </View>
              <Alert
                type="info"
                size="sm"
                title={t('Hold your phone still until the process is complete.')}
              />
            </>
          ) : (
            <>
              {/* The steps take the panel's free space, so the dots and the button stay
              at the bottom of the card, the same as on mobile */}
              <SyncImportSteps
                steps={steps}
                stepIndex={stepIndex}
                style={flexbox.flex1}
                illustrationCardStyle={{ height: ILLUSTRATION_CARD_HEIGHT }}
              />
              <SyncImportStepsFooter
                steps={steps}
                stepIndex={stepIndex}
                onStepIndexChange={setStepIndex}
                finishText={t('Sync from mobile')}
                finishIcon={<SyncIcon width={24} height={24} color="#fff" style={spacings.mrTy} />}
                onFinish={() => setIsScanning(true)}
                style={spacings.mtLg}
              />
            </>
          )}
        </Panel>
      </TabLayoutWrapperMainContent>

      <BottomSheetPasswordConfirmation
        id="verify-mobile-password"
        sheetRef={passwordSheetRef}
        closeBottomSheet={handleClosePasswordSheet}
        title={t('Verify mobile password')}
        text={t('Enter your mobile app password')}
        submitText={t('Confirm')}
        isSubmitting={isImporting}
        onCustomSubmit={importScannedAccounts}
        // Only called when the local keystore gets unlocked, which this flow never does
        onPasswordConfirmed={() => {}}
      >
        <Alert
          type="info"
          size="sm"
          style={spacings.mtSm}
          title={t('Note')}
          text={t(
            'Make sure you are entering the password of your Ambire mobile app, not the one of this extension.'
          )}
        />
        {!!scannedAccounts.length && (
          <Text fontSize={14} appearance="secondaryText" style={spacings.mtSm}>
            {t('{{count}} account{{s}} will be imported.', {
              count: scannedAccounts.length,
              s: scannedAccounts.length > 1 ? 's' : ''
            })}
          </Text>
        )}
      </BottomSheetPasswordConfirmation>
    </TabLayoutContainer>
  )
}

export default React.memo(SyncFromMobileScreen)
