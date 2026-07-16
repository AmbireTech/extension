import { Buffer } from 'buffer'
import React, { useCallback, useEffect, useState } from 'react'
import { ColorValue, Linking, View } from 'react-native'

import OpenIcon from '@common/assets/svg/OpenIcon'
import Alert from '@common/components/Alert'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { QrWalletConfigs } from '@common/modules/hardware-wallets/qr/wallets'
import QrScannerWithPermission from '@common/modules/hardware-wallets/screens/QrScannerWithPermission'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const SCANNER_SIZE = 280

const QrConnectScreen = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { dispatch } = useControllersMiddleware()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { initParams, type } = useController('AccountPickerController').state
  const mainCtrlState = useController('MainController').state
  const { height } = useWindowSize()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  // Bumping the key remounts the scanner so its camera + UR decoder reset on retry.
  const [scannerKey, setScannerKey] = useState(0)

  const onQrComplete = useCallback(
    (payload: Uint8Array) => {
      setIsSubmitting(true)
      setScanError(null)
      // Hex-encode: the RN↔worker bridge's richJson codec does not preserve
      // Uint8Array. QrKeyIterator/parseAccountPayload accept hex on both platforms.
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_QR_WALLET',
        params: { payload: Buffer.from(payload).toString('hex') }
      })
    },
    [dispatch]
  )

  const resetScanner = useCallback(() => {
    setIsSubmitting(false)
    setScanError(null)
    setScannerKey((prev) => prev + 1)
  }, [])

  const handleBackButtonPressed = useCallback(() => {
    resetScanner()
    goToPrevRoute()
  }, [goToPrevRoute, resetScanner])

  const handleOpenTutorial = useCallback(
    async (tutorialUrl?: string) => {
      if (!tutorialUrl) return
      try {
        await Linking.openURL(tutorialUrl)
      } catch (error: any) {
        addToast(error?.message || t('Failed to open tutorial.'), { type: 'error' })
      }
    },
    [addToast, t]
  )

  useEffect(() => {
    if (
      isSubmitting &&
      mainCtrlState.statuses.handleAccountPickerInitQr === 'SUCCESS' &&
      initParams &&
      type === 'qr'
    ) {
      setIsSubmitting(false)
      goToNextRoute()
    }
  }, [
    isSubmitting,
    initParams,
    type,
    goToNextRoute,
    mainCtrlState.statuses.handleAccountPickerInitQr
  ])

  useEffect(() => {
    if (isSubmitting && mainCtrlState.statuses.handleAccountPickerInitQr === 'ERROR') {
      setIsSubmitting(false)
      setScanError(t('Failed to import QR wallet. Please try scanning again.'))
    }
  }, [isSubmitting, mainCtrlState.statuses.handleAccountPickerInitQr, t])

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={handleBackButtonPressed}
        title={t('Connect QR wallet')}
      >
        <Text fontSize={14} style={[spacings.mbSm, { textAlign: 'center' }]}>
          {t('Scan your hardware wallet’s QR code.')}
        </Text>

        <View
          style={{
            width: SCANNER_SIZE + 4,
            height: SCANNER_SIZE + 4,
            alignSelf: 'center',
            borderRadius: BORDER_RADIUS_PRIMARY + 6,
            overflow: 'hidden'
          }}
        >
          <QrScannerWithPermission
            key={scannerKey}
            onComplete={onQrComplete}
            disabled={isSubmitting}
            externalError={scanError}
            onExternalRetry={resetScanner}
          />
        </View>

        <View style={height < 700 ? spacings.mtSm : spacings.mtLg}>
          {QrWalletConfigs.map((wallet) => (
            <QrWalletRow
              key={`${wallet.type}-${wallet.protocol}`}
              label={wallet.label}
              tutorialUrl={wallet.tutorialUrl}
              onOpenTutorial={handleOpenTutorial}
              iconColor={theme.iconPrimary}
            />
          ))}
        </View>

        <Alert
          type="warning"
          size="sm"
          style={spacings.mtSm}
          title={t('Behavior may vary when importing from unlisted QR wallets.')}
        />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

const QrWalletRow = React.memo(
  ({
    label,
    tutorialUrl,
    onOpenTutorial,
    iconColor
  }: {
    label: string
    tutorialUrl?: string
    onOpenTutorial: (tutorialUrl?: string) => void
    iconColor: ColorValue
  }) => {
    const { t } = useTranslation()

    const { height } = useWindowSize()
    const { theme } = useTheme()

    return (
      <AnimatedPressable
        disabled={!tutorialUrl}
        onPress={() => onOpenTutorial(tutorialUrl)}
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          height < 700 ? spacings.mbTy : spacings.mbSm,
          { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_PRIMARY },
          spacings.phSm,
          height < 700 ? spacings.pvTy : spacings.pvSm
        ]}
      >
        <Text fontSize={16} weight="medium">
          {label}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text fontSize={14} weight="medium" appearance="secondaryText" style={spacings.mrTy}>
            {t('Tutorial')}
          </Text>
          <OpenIcon color={iconColor} width={18} height={18} />
        </View>
      </AnimatedPressable>
    )
  }
)

QrWalletRow.displayName = 'QrWalletRow'

export default React.memo(QrConnectScreen)
