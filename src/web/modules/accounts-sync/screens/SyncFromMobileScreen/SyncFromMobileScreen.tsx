import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import SyncIcon from '@common/assets/svg/SyncIcon'
import Alert from '@common/components/Alert'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import SyncImportSteps, {
  SyncImportStep
} from '@common/modules/accounts-sync/components/SyncImportSteps'
import useAccountsSyncImport from '@common/modules/accounts-sync/hooks/useAccountsSyncImport'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import QrScannerWithPermission from '@web/modules/hardware-wallet/screens/QrScannerWithPermission'
import BottomSheetPasswordConfirmation from '@web/modules/settings/components/BottomSheetPasswordConfirmation'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const SCANNER_SIZE = 290

const selectHasPasswordSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.hasPasswordSecret

const SyncFromMobileScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const { state: hasPasswordSecret } = useController('KeystoreController', selectHasPasswordSecret)
  const {
    ref: passwordSheetRef,
    open: openPasswordSheet,
    close: closePasswordSheet
  } = useModalize()
  const [isScanning, setIsScanning] = useState(false)

  const steps: SyncImportStep[] = useMemo(
    () => [
      {
        id: 'steps-on-mobile',
        // TODO: Missing asset - the illustration (or animation) of the two steps on the
        // Ambire mobile app, the counterpart of the Lottie of the steps on the extension.
        illustration: null,
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
        // TODO: Missing asset - the illustration of the QR codes shown on the phone.
        illustration: null,
        content: (
          <Text fontSize={14} weight="medium" appearance="secondaryText">
            {t(
              "Scan the QR codes with your computer's camera to sync the accounts. Hold the scanner until the process is complete."
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
    navigate(hasPasswordSecret ? WEB_ROUTES.accountPersonalize : WEB_ROUTES.keyStoreSetup)
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
          onBackButtonPress={() => navigate(WEB_ROUTES.accountSelect)}
          title={t('Sync from Ambire mobile')}
        >
          {isScanning ? (
            <>
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
              finishText={t('Sync from mobile')}
              finishIcon={<SyncIcon width={20} height={20} color="#fff" style={spacings.mrTy} />}
              onFinish={() => setIsScanning(true)}
            />
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
