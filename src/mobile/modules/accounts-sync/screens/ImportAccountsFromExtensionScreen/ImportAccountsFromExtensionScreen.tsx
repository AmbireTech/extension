import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image, ImageSourcePropType, LayoutChangeEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel'

import scanQrCodes from '@common/assets/images/scan-qr-codes.png'
import syncStepsOnTheExtension from '@common/assets/images/sync-steps-on-the-extension.gif'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { DEVICE_SECURITY_LEVEL } from '@common/contexts/biometricsContext/constants'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import SyncImportSteps, {
  SyncImportStep,
  SyncImportStepsFooter
} from '@common/modules/accounts-sync/components/SyncImportSteps'
import SyncPasswordOptions from '@common/modules/accounts-sync/components/SyncPasswordOptions'
import SyncScanFeedbackAlert from '@common/modules/accounts-sync/components/SyncScanFeedbackAlert'
import useAccountsSyncImport from '@common/modules/accounts-sync/hooks/useAccountsSyncImport'
import useSyncedPasswordSetup from '@common/modules/accounts-sync/hooks/useSyncedPasswordSetup'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { QrScanProgress } from '@common/modules/hardware-wallets/qr/utils/qrScanFeedback'
import QrScannerWithPermission from '@common/modules/hardware-wallets/screens/QrScannerWithPermission'
import { ROUTES } from '@common/modules/router/constants/common'
import PasswordConfirmation from '@common/modules/settings/components/PasswordConfirmation'
import spacings from '@common/styles/spacings'
import common, { BORDER_RADIUS_PRIMARY, BORDER_RADIUS_SECONDARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
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

const ImportAccountsFromExtensionScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { navigate, goBack, canGoBack } = useNavigation()
  const { addToast } = useToast()
  const { goToPrevRoute } = useOnboardingNavigation()
  const { state: hasPasswordSecret } = useController('KeystoreController', selectHasPasswordSecret)
  const { state: accountsCount } = useController('AccountsController', selectAccountsCount)
  const {
    ref: passwordSheetRef,
    open: openPasswordSheet,
    close: closePasswordSheet
  } = useModalize()
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState<QrScanProgress | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  // Onboarding only: the extension's password becomes this app's password as well, so
  // there is no second one to set. Off means the app asks for its own password next.
  const [isPasswordReused, setIsPasswordReused] = useState(true)
  const [isBiometricsToggled, setIsBiometricsToggled] = useState<boolean | null>(null)
  const { isEnrolled, deviceSecurityLevel, saveBiometricsSecret } = useBiometrics()
  // The secret is stored behind a key that only a strong (Class 3) biometric can release,
  // so a weak one (e.g. 2D face unlock on Android) would fail to save it.
  const isStrongBiometricsEnrolled =
    isEnrolled && deviceSecurityLevel === DEVICE_SECURITY_LEVEL.BIOMETRIC_STRONG
  // On by default once the device turns out to have biometrics, the same as on the
  // keystore setup screen, until the user says otherwise
  const isBiometricsEnabled = isBiometricsToggled ?? isStrongBiometricsEnrolled
  const carouselRef = useRef<ICarouselInstance>(null)
  // The carousel needs an explicit width equal to its container's actual laid-out
  // width, so we measure it instead of guessing from the window
  const [carouselWidth, setCarouselWidth] = useState(0)

  const handleCarouselLayout = useCallback((e: LayoutChangeEvent) => {
    setCarouselWidth(e.nativeEvent.layout.width)
  }, [])

  const steps: SyncImportStep[] = useMemo(
    () => [
      {
        id: 'steps-on-the-extension',
        illustration: (
          // The animation is a screenshot of the extension, so the design gives it the
          // rounded corners and the drop shadow of a window floating above the card
          <View
            style={{
              ...common.shadowPrimary,
              ...flexbox.alignSelfCenter,
              borderRadius: BORDER_RADIUS_SECONDARY,
              backgroundColor: theme.primaryBackground
            }}
          >
            <Image
              source={syncStepsOnTheExtension as ImageSourcePropType}
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
              'Scan the QR codes with this device to sync the accounts. Hold your phone still until the process is complete.'
            )}
          </Text>
        )
      }
    ],
    [t, theme]
  )

  const handlePasswordSet = useCallback(() => {
    closePasswordSheet()
    navigate(ROUTES.accountPersonalize)
  }, [closePasswordSheet, navigate])

  const { setPasswordFromSync, isSettingPassword } = useSyncedPasswordSetup({
    onPasswordSet: handlePasswordSet
  })

  const handleImported = useCallback(
    async (password: string) => {
      // During onboarding the accounts arrive before this device has a password of its
      // own. Reusing the extension's one sets it (and biometrics) right here, so the
      // keystore setup screen is skipped and the sheet stays up until it lands.
      if (!hasPasswordSecret && isPasswordReused) {
        // A refused biometric prompt returns no secret. The accounts are already
        // imported and the password still has to be set, so the flow goes on without
        // biometrics and only says so.
        const biometricsSecret = isBiometricsEnabled ? await saveBiometricsSecret() : null

        if (isBiometricsEnabled && !biometricsSecret)
          addToast(t('Biometrics were not enabled. You can turn them on in Settings.'), {
            type: 'info'
          })

        setPasswordFromSync({ password, biometricsSecret })
        return
      }

      closePasswordSheet()
      // Without a password of its own, setting one comes next. Otherwise the freshly
      // imported accounts can be named right away.
      navigate(hasPasswordSecret ? ROUTES.accountPersonalize : ROUTES.keyStoreSetup)
    },
    [
      addToast,
      closePasswordSheet,
      hasPasswordSecret,
      isBiometricsEnabled,
      isPasswordReused,
      navigate,
      saveBiometricsSecret,
      setPasswordFromSync,
      t
    ]
  )

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

  // Closing the sheet keeps the scanned accounts, so that the user can pick the password
  // step back up from the alert instead of scanning all the codes again
  const handleClosePasswordSheet = useCallback(() => closePasswordSheet(), [closePasswordSheet])

  // The steps are swipeable, so the carousel owns the current step and `stepIndex`
  // follows it. Changing the step from the outside means scrolling the carousel.
  const handleStepIndexChange = useCallback((nextStepIndex: number) => {
    carouselRef.current?.scrollTo({ index: nextStepIndex, animated: true })
  }, [])

  const renderStep = useCallback(
    ({ index }: { index: number }) => <SyncImportSteps steps={steps} stepIndex={index} />,
    [steps]
  )

  const handleBackButtonPress = useCallback(() => {
    // The scanner is a step of this screen, so going back returns to the instructions. This
    // is where the scanned accounts are dropped, so that leaving and coming back starts a
    // fresh scan - dismissing the password prompt keeps them.
    if (isScanning) {
      retryScan()
      return setIsScanning(false)
    }

    // Same for the instructions themselves, which are a couple of steps
    if (stepIndex) return handleStepIndexChange(stepIndex - 1)

    // Without accounts this is the onboarding flow, which came from the get started screen
    if (!accountsCount) return goToPrevRoute()

    // Going back instead of navigating, so the screen the user came from doesn't end up
    // with this one still ahead of it in the history
    if (canGoBack) return goBack()

    navigate(ROUTES.accountSelect)
  }, [
    accountsCount,
    canGoBack,
    goBack,
    goToPrevRoute,
    handleStepIndexChange,
    isScanning,
    navigate,
    retryScan,
    stepIndex
  ])

  const handleStartScanning = useCallback(() => {
    setScanProgress(null)
    setIsScanning(true)
  }, [])

  const togglePasswordReuse = useCallback(() => setIsPasswordReused((prev) => !prev), [])

  const toggleBiometrics = useCallback(
    () => setIsBiometricsToggled(!isBiometricsEnabled),
    [isBiometricsEnabled]
  )

  return (
    <MobileLayoutContainer
      footer={
        isScanning ? (
          <>
            <SyncScanFeedbackAlert
              // A rejected code puts its own message over the scanner, so the aiming hints
              // (and the progress of a scan that led nowhere) step aside
              progress={scanError ? null : scanProgress}
              hasScannedPayload={hasScannedPayload}
              scannedAccountsCount={scannedAccounts.length}
            />
            {/* The password prompt opens on its own, so this is how the user gets back to
            it after dismissing it, without having to scan everything again */}
            {!!hasScannedPayload && (
              <Button
                testID="continue-after-sync-scan"
                type="primary"
                text={t('Continue')}
                onPress={openPasswordSheet as () => void}
                hasBottomSpacing={false}
                style={spacings.mtMd}
              />
            )}
          </>
        ) : (
          <SyncImportStepsFooter
            steps={steps}
            stepIndex={stepIndex}
            onStepIndexChange={handleStepIndexChange}
            finishText={t('Scan QR code')}
            onFinish={handleStartScanning}
          />
        )
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={handleBackButtonPress}
        title={t('Import from extension')}
      >
        {isScanning ? (
          <>
            <Text
              fontSize={14}
              weight="medium"
              appearance="secondaryText"
              style={[text.center, spacings.mbLg]}
            >
              {t('Scan the QR codes generated on your Ambire extension.')}
            </Text>
            {/* The same framing as the QR hardware wallet scanner */}
            <View
              style={{
                width: SCANNER_SIZE + 4,
                height: SCANNER_SIZE + 4,
                ...flexbox.alignSelfCenter,
                borderRadius: BORDER_RADIUS_PRIMARY + 6,
                overflow: 'hidden'
              }}
            >
              <QrScannerWithPermission
                onComplete={handleScanComplete}
                disabled={hasScannedPayload || isImporting}
                externalError={scanError}
                onExternalRetry={retryScan}
                onProgress={setScanProgress}
              />
            </View>
          </>
        ) : (
          <View style={flexbox.flex1} onLayout={handleCarouselLayout}>
            {carouselWidth > 0 && (
              <Carousel
                ref={carouselRef}
                width={carouselWidth}
                data={steps}
                loop={false}
                // Leaving the scanner remounts the carousel, which must come back on the
                // step the scanner was started from
                defaultIndex={stepIndex}
                onSnapToItem={setStepIndex}
                renderItem={renderStep}
              />
            )}
          </View>
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
          // The sheet opens after this mounts, so an automatic focus would land off
          // screen and leave the keyboard down - the field is tapped instead
          withAutoFocus={false}
          isSubmitting={isImporting || isSettingPassword}
          onCustomSubmit={importScannedAccounts}
          // Only called when the local keystore gets unlocked, which this flow never does
          onPasswordConfirmed={() => {}}
          onBackButtonPress={handleClosePasswordSheet}
        >
          <Alert
            type="info"
            size="sm"
            title={t('Make sure you are entering the password of your Ambire extension.')}
          />
          {!hasPasswordSecret && (
            <SyncPasswordOptions
              isPasswordReused={isPasswordReused}
              onTogglePasswordReuse={togglePasswordReuse}
              isBiometricsAvailable={isStrongBiometricsEnrolled}
              isBiometricsEnabled={isBiometricsEnabled}
              onToggleBiometrics={toggleBiometrics}
            />
          )}
        </PasswordConfirmation>
      </BottomSheet>
    </MobileLayoutContainer>
  )
}

export default React.memo(ImportAccountsFromExtensionScreen)
