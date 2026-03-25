import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Linking, TouchableOpacity, View } from 'react-native'

import DiagonalRightArrowIcon from '@common/assets/svg/DiagonalRightArrowIcon'
import LinkIcon from '@common/assets/svg/LinkIcon'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import { QrWalletRegistry } from '@web/modules/hardware-wallet/qr/wallets'

import QrScanner from './QrScanner'

const VISIBLE_WALLETS_COUNT = 2
const QR_WALLET_ROW_HEIGHT = 56

const QrConnectScreen = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { dispatch } = useControllersMiddleware()
  const { addToast } = useToast()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const { initParams, type } = useController('AccountPickerController').state
  const mainCtrlState = useController('MainController').state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scannerKey, setScannerKey] = useState(0)
  const [showMore, setShowMore] = useState(false)
  const wrapperRef = useRef<View | null>(null)
  const animatedHeight = useRef(new Animated.Value(0)).current
  const animatedOpacity = useRef(new Animated.Value(0)).current

  const qrWallets = useMemo(() => Object.values(QrWalletRegistry), [])
  const hiddenWallets = useMemo(() => qrWallets.slice(VISIBLE_WALLETS_COUNT), [qrWallets])

  const hiddenContentHeight = hiddenWallets.length * QR_WALLET_ROW_HEIGHT

  const animatedContainerHeight = useMemo(
    () =>
      animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, hiddenContentHeight]
      }),
    [animatedHeight, hiddenContentHeight]
  )

  const onQrComplete = useCallback(
    async (payload: string | Uint8Array) => {
      try {
        setIsSubmitting(true)

        dispatch({
          type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_QR_WALLET',
          params: { payload }
        })
      } catch (error: any) {
        addToast(error?.message || t('Failed to import QR wallet.'), { type: 'error' })
        setIsSubmitting(false)
      }
    },
    [dispatch, addToast, t]
  )

  const onResetScannerPress = useCallback(() => {
    setIsSubmitting(false)
    setScannerKey((prev) => prev + 1)
    console.count('onResetScannerPress')
  }, [])

  const handleBackButtonPressed = useCallback(() => {
    onResetScannerPress()
    goToPrevRoute()
  }, [goToPrevRoute, onResetScannerPress])

  const handleToggleShowMore = useCallback(() => {
    setShowMore((prev) => !prev)
  }, [])

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
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: showMore ? 1 : 0,
        duration: 220,
        useNativeDriver: false
      }),
      Animated.timing(animatedOpacity, {
        toValue: showMore ? 1 : 0,
        duration: 220,
        useNativeDriver: false
      })
    ]).start()
  }, [showMore, animatedHeight, animatedOpacity])

  useEffect(() => {
    if (initParams && type === 'qr') {
      goToNextRoute()
    }
  }, [initParams, type, goToNextRoute])

  useEffect(() => {
    if (mainCtrlState.statuses.handleAccountPickerInitQr === 'ERROR') {
      setIsSubmitting(false)
    }
  }, [mainCtrlState.statuses.handleAccountPickerInitQr])

  const renderWalletRow = useCallback(
    (wallet: (typeof qrWallets)[number]) => (
      <View
        key={wallet.walletType}
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          { minHeight: QR_WALLET_ROW_HEIGHT }
        ]}
      >
        <Text fontSize={16} weight="medium">
          {wallet.label}
        </Text>

        <TouchableOpacity
          disabled={!wallet.tutorialUrl}
          onPress={() => handleOpenTutorial(wallet.tutorialUrl)}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text fontSize={14} weight="medium" appearance="secondaryText" style={spacings.mrTy}>
              {t('Tutorial')}
            </Text>
            <LinkIcon color={theme.iconPrimary} width={18} height={18} />
          </View>
        </TouchableOpacity>
      </View>
    ),
    [handleOpenTutorial, t, theme.iconPrimary]
  )

  const handleQrError = useCallback(
    (message: string) => {
      addToast(message, { type: 'error' })
    },
    [addToast]
  )

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent wrapperRef={wrapperRef} contentContainerStyle={spacings.mbLg}>
        <Panel
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={handleBackButtonPressed}
          title={t('Connect QR wallet')}
        >
          <Text fontSize={16} style={spacings.mbTy}>
            {t('Scan the QR code exported by your hardware wallet.')}
          </Text>

          <QrScanner
            key={scannerKey}
            onComplete={onQrComplete}
            onError={handleQrError}
            disabled={isSubmitting}
          />

          <Text fontSize={16} style={spacings.mtLg}>
            {t('You can choose from a list of official QR-code supporting partners bellow.')}
          </Text>

          <View style={spacings.mtMd}>
            {qrWallets.slice(0, VISIBLE_WALLETS_COUNT).map(renderWalletRow)}

            <Animated.View
              style={{
                height: animatedContainerHeight,
                opacity: animatedOpacity,
                overflow: 'hidden'
              }}
            >
              {hiddenWallets.map(renderWalletRow)}
            </Animated.View>

            {qrWallets.length > VISIBLE_WALLETS_COUNT && (
              <TouchableOpacity
                onPress={handleToggleShowMore}
                testID="show-more-qr-wallets-btn"
                style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyCenter]}
              >
                <Text appearance="tertiaryText" fontSize={14} weight="medium" style={spacings.mrMi}>
                  {t(showMore ? 'Less' : 'More')}
                </Text>
                <Animated.View>
                  <DiagonalRightArrowIcon
                    color={theme.iconPrimary}
                    width={18}
                    height={18}
                    style={{
                      transform: [{ rotate: showMore ? '90deg' : '0deg' }]
                    }}
                  />
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(QrConnectScreen)
