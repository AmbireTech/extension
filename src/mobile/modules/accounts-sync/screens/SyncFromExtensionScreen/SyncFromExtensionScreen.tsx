import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ImageSourcePropType, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import scanQrCodes from '@common/assets/images/scan-qr-codes.png'
import syncStepsOnTheExtension from '@common/assets/images/sync-steps-on-the-extension.gif'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import SyncImportSteps, {
  SyncImportStep
} from '@common/modules/accounts-sync/components/SyncImportSteps'
import useAccountsSyncImport from '@common/modules/accounts-sync/hooks/useAccountsSyncImport'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import QrScannerWithPermission from '@common/modules/hardware-wallets/screens/QrScannerWithPermission'
import { ROUTES } from '@common/modules/router/constants/common'
import PasswordConfirmation from '@common/modules/settings/components/PasswordConfirmation'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const SCANNER_SIZE = 280
// The asset is delivered at twice this size, so it stays sharp on dense screens
const SCAN_ILLUSTRATION_SIZE = 236
const ANIMATION_HEIGHT = 300
const ANIMATION_ASPECT_RATIO = 480 / 598

const selectHasPasswordSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.hasPasswordSecret
const selectAccountsCount = (state: AllControllersMappingType['AccountsController']) =>
  state.accounts.length

const SyncFromExtensionScreen = () => {
  const { t } = useTranslation()
  const { navigate, goBack, canGoBack } = useNavigation()
  const { goToPrevRoute } = useOnboardingNavigation()
  const { state: hasPasswordSecret } = useController('KeystoreController', selectHasPasswordSecret)
  const { state: accountsCount } = useController('AccountsController', selectAccountsCount)
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
        id: 'steps-on-the-extension',
        illustration: (
          <Image
            source={syncStepsOnTheExtension as ImageSourcePropType}
            resizeMode="contain"
            style={{
              width: ANIMATION_HEIGHT * ANIMATION_ASPECT_RATIO,
              height: ANIMATION_HEIGHT,
              alignSelf: 'center'
            }}
          />
        ),
        content: (
          <>
            <Text fontSize={14} weight="medium" appearance="secondaryText">
              {t('1. Find "Sync with mobile" in the Accounts section on the Ambire extension.')}
            </Text>
            <Text fontSize={14} weight="medium" appearance="secondaryText">
              {t('2. Click on "Export to mobile".')}
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
              'Scan the QR codes with this device to sync the accounts. Hold the scanner until the process is complete.'
            )}
          </Text>
        )
      }
    ],
    [t]
  )

  const handleImported = useCallback(() => {
    closePasswordSheet()
    // During onboarding the accounts arrive before this device has a password of its
    // own, so setting one comes next. Otherwise the freshly imported accounts can be
    // named right away.
    navigate(hasPasswordSecret ? ROUTES.accountPersonalize : ROUTES.keyStoreSetup)
  }, [closePasswordSheet, hasPasswordSecret, navigate])

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

  const handleClosePasswordSheet = useCallback(() => {
    closePasswordSheet()
    retryScan()
  }, [closePasswordSheet, retryScan])

  const handleBackButtonPress = useCallback(() => {
    // The scanner is a step of this screen, so going back returns to the instructions
    if (isScanning) return setIsScanning(false)

    // Same for the instructions themselves, which are a couple of steps
    if (stepIndex) return setStepIndex(stepIndex - 1)

    // Without accounts this is the onboarding flow, which came from the get started screen
    if (!accountsCount) return goToPrevRoute()

    // Going back instead of navigating, so the screen the user came from doesn't end up
    // with this one still ahead of it in the history
    if (canGoBack) return goBack()

    navigate(ROUTES.accountSelect)
  }, [accountsCount, canGoBack, goBack, goToPrevRoute, isScanning, navigate, stepIndex])

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={handleBackButtonPress}
        title={isScanning ? t('Scan QR code') : t('Import from extension')}
      >
        {isScanning ? (
          <>
            <View
              style={{
                width: SCANNER_SIZE,
                height: SCANNER_SIZE,
                ...flexbox.alignSelfCenter,
                borderRadius: BORDER_RADIUS_PRIMARY,
                overflow: 'hidden'
              }}
            >
              <QrScannerWithPermission
                onComplete={handleScanComplete}
                disabled={hasScannedPayload || isImporting}
                externalError={scanError}
                onExternalRetry={retryScan}
              />
            </View>
            <Alert
              type="info"
              size="sm"
              style={spacings.mtSm}
              title={t('Hold the scanner until the process is complete.')}
            />
          </>
        ) : (
          <SyncImportSteps
            steps={steps}
            stepIndex={stepIndex}
            onStepIndexChange={setStepIndex}
            finishText={t('Scan QR code')}
            onFinish={() => setIsScanning(true)}
          />
        )}
      </MobileLayoutWrapperMainContent>

      <BottomSheet
        id="verify-extension-password"
        sheetRef={passwordSheetRef}
        closeBottomSheet={handleClosePasswordSheet}
      >
        <PasswordConfirmation
          title={t('Verify extension password')}
          text={t('Enter your extension password')}
          submitText={t('Confirm')}
          isSubmitting={isImporting}
          onCustomSubmit={importScannedAccounts}
          // Only called when the local keystore gets unlocked, which this flow never does
          onPasswordConfirmed={() => {}}
          onBackButtonPress={handleClosePasswordSheet}
        >
          <Alert
            type="info"
            size="sm"
            style={spacings.mtSm}
            title={t('Note')}
            text={t(
              'Make sure you are entering the password of your Ambire extension, not the one of this app.'
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
        </PasswordConfirmation>
      </BottomSheet>
    </MobileLayoutContainer>
  )
}

export default React.memo(SyncFromExtensionScreen)
