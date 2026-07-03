import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useHasGasTank from '@common/hooks/useHasGasTank'
import useTheme from '@common/hooks/useTheme'
import { storage } from '@common/services/storage'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getGasTankTokenDetails } from '@common/utils/getGasTankTokenDetails'
import { privateValue } from '@common/utils/ui'

const SAFE_GAS_TANK_BANNER_DISMISSED_STORAGE_KEY_PREFIX = 'safeGasTankDashboardBannerDismissed'

interface Props {
  onPress: () => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
}

const GasTankButton = ({ onPress, portfolio, account }: Props) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [isSafeGasTankBannerDismissed, setIsSafeGasTankBannerDismissed] = useState(true)
  const [isSafeGasTankBannerDismissalLoaded, setIsSafeGasTankBannerDismissalLoaded] =
    useState(false)
  const { canUseGasTank } = useHasGasTank({ account })
  const { isPrivacyModeEnabled } = useController('WalletStateController').state

  const {
    state: { networks }
  } = useController('NetworksController')

  const totalBalanceGasTankDetails = useMemo(
    () => getGasTankTokenDetails(portfolio, account, networks),
    [account, networks, portfolio]
  )

  const isSafeAccount = !!account?.safeCreation
  const hasGasTankBalance = !!totalBalanceGasTankDetails.balanceUSDFormatted
  const safeGasTankBannerDismissedStorageKey = useMemo(() => {
    if (!isSafeAccount || !account?.addr) return null

    return `${SAFE_GAS_TANK_BANNER_DISMISSED_STORAGE_KEY_PREFIX}:${account.addr.toLowerCase()}`
  }, [account?.addr, isSafeAccount])

  const buttonState = useMemo(() => {
    if (totalBalanceGasTankDetails.token === null) return 'error'
    if (canUseGasTank && totalBalanceGasTankDetails.balanceUSDFormatted) return 'balance'

    return 'generic'
  }, [
    canUseGasTank,
    totalBalanceGasTankDetails.balanceUSDFormatted,
    totalBalanceGasTankDetails.token
  ])

  useEffect(() => {
    let isMounted = true

    setIsSafeGasTankBannerDismissed(true)
    setIsSafeGasTankBannerDismissalLoaded(false)

    if (!safeGasTankBannerDismissedStorageKey) {
      setIsSafeGasTankBannerDismissalLoaded(true)

      return () => {
        isMounted = false
      }
    }

    storage
      .get(safeGasTankBannerDismissedStorageKey, false)
      .then((isDismissed) => {
        if (!isMounted) return

        setIsSafeGasTankBannerDismissed(!!isDismissed)
        setIsSafeGasTankBannerDismissalLoaded(true)
      })
      .catch((error) => {
        console.error('Failed to load safeGasTankDashboardBannerDismissed', error)
        captureException(error)

        if (isMounted) setIsSafeGasTankBannerDismissalLoaded(true)
      })

    return () => {
      isMounted = false
    }
  }, [safeGasTankBannerDismissedStorageKey])

  const shouldDisplaySafeGasTankBanner =
    isSafeAccount &&
    hasGasTankBalance &&
    isSafeGasTankBannerDismissalLoaded &&
    !isSafeGasTankBannerDismissed

  // Purposely don't disable the button (but block the onPress action) in
  // case of a tooltip, because it should be clickable to show the tooltip.
  const doesHaveTooltip = buttonState === 'error'
  const handleOnPress = useCallback(() => {
    if (doesHaveTooltip) return

    if (shouldDisplaySafeGasTankBanner && safeGasTankBannerDismissedStorageKey) {
      setIsSafeGasTankBannerDismissed(true)
      storage.set(safeGasTankBannerDismissedStorageKey, true).catch((error) => {
        console.error('Failed to persist safeGasTankDashboardBannerDismissed', error)
        captureException(error)
      })
    }

    return onPress()
  }, [
    doesHaveTooltip,
    onPress,
    safeGasTankBannerDismissedStorageKey,
    shouldDisplaySafeGasTankBanner
  ])

  const text = useMemo(() => {
    if (shouldDisplaySafeGasTankBanner) {
      return totalBalanceGasTankDetails.balanceUSD === 0
        ? '$0'
        : `${totalBalanceGasTankDetails.balanceUSDFormatted}`
    }

    if (['generic', 'error'].includes(buttonState)) return t('Gas Tank')

    return totalBalanceGasTankDetails.balanceUSD === 0
      ? '$0'
      : `${totalBalanceGasTankDetails.balanceUSDFormatted}`
  }, [
    buttonState,
    shouldDisplaySafeGasTankBanner,
    t,
    totalBalanceGasTankDetails.balanceUSD,
    totalBalanceGasTankDetails.balanceUSDFormatted
  ])

  const tooltipText = useMemo(() => {
    if (buttonState === 'error') return t("Couldn't load. Please try again later.")

    return ''
  }, [buttonState, t])

  const shouldDisplayOnGasTank = buttonState === 'balance' || shouldDisplaySafeGasTankBanner
  const shouldDisplayValue = buttonState === 'balance' || shouldDisplaySafeGasTankBanner
  const isRegularHovered = isHovered && !shouldDisplaySafeGasTankBanner
  const isSafeGasTankBannerHovered = isHovered && shouldDisplaySafeGasTankBanner
  const primaryButtonTextColor = useMemo(() => {
    if (isRegularHovered) return '#000000'
    if (isSafeGasTankBannerHovered) return '#000000'

    return theme.neutral200
  }, [isRegularHovered, isSafeGasTankBannerHovered, theme.neutral200])

  const secondaryButtonTextColor = useMemo(() => {
    if (isRegularHovered) return '#000000'
    if (isSafeGasTankBannerHovered) return '#000000'

    return hexToRgba(theme.neutral200, 0.72)
  }, [isRegularHovered, isSafeGasTankBannerHovered, theme.neutral200])

  const handleHoverIn = useCallback(() => setIsHovered(true), [])
  const handleHoverOut = useCallback(() => setIsHovered(false), [])

  const buttonStyle = useMemo<ViewStyle>(
    () => ({
      ...flexbox.directionRow,
      ...flexbox.center,
      ...spacings.phSm,
      ...spacings.mrMi,
      ...(!!tooltipText && ({ cursor: 'default' } as unknown as ViewStyle)),
      borderColor: shouldDisplaySafeGasTankBanner
        ? theme.success200
        : isRegularHovered
          ? '#FFFFFF'
          : '#FFFFFF1F',
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: shouldDisplaySafeGasTankBanner
        ? isSafeGasTankBannerHovered
          ? theme.success200
          : 'rgb(14 59 24)'
        : isRegularHovered
          ? '#FFFFFF'
          : '#000000',
      height: 26,
      shadowColor: shouldDisplaySafeGasTankBanner
        ? isSafeGasTankBannerHovered
          ? theme.success200
          : theme.success400
        : undefined,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: shouldDisplaySafeGasTankBanner ? 0.7 : 0,
      shadowRadius: shouldDisplaySafeGasTankBanner ? 18 : 0,
      elevation: shouldDisplaySafeGasTankBanner ? 12 : 0,
      ...(shouldDisplaySafeGasTankBanner
        ? {
            boxShadow: `0 0 8px 3px ${hexToRgba(
              isSafeGasTankBannerHovered ? theme.success200 : theme.success400,
              0.55
            )}`
          }
        : {})
    }),
    [
      isRegularHovered,
      isSafeGasTankBannerHovered,
      shouldDisplaySafeGasTankBanner,
      theme.success200,
      theme.success400,
      tooltipText
    ]
  )

  if (!portfolio.isReadyToVisualize) {
    return <SkeletonLoader lowOpacity width={80} height={26} borderRadius={12} />
  }

  return (
    <Pressable
      onPress={handleOnPress}
      // @ts-ignore
      style={buttonStyle}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      testID={
        shouldDisplaySafeGasTankBanner
          ? 'dashboard-safe-gas-tank-banner'
          : buttonState === 'balance'
            ? 'dashboard-gas-tank-balance'
            : 'dashboard-gas-tank-button'
      }
    >
      {shouldDisplaySafeGasTankBanner && (
        <>
          <View
            style={{
              ...flexbox.center,
              ...spacings.phTy,
              backgroundColor: themeType === THEME_TYPES.DARK ? theme.success300 : theme.success200,
              borderRadius: 12,
              height: 20,
              marginLeft: -8
            }}
          >
            <Text
              color={isSafeGasTankBannerHovered ? '#000000' : theme.success500}
              weight="number_bold"
              fontSize={13}
            >
              {t('NEW')}
            </Text>
          </View>
          <View
            style={{
              ...spacings.mhTy,
              backgroundColor: isSafeGasTankBannerHovered ? '#000000' : theme.success400,
              height: 20,
              width: 1
            }}
          />
        </>
      )}
      <GasTankIcon
        width={18}
        height={18}
        color={primaryButtonTextColor}
        hasError={buttonState === 'error'}
      />
      <Text
        style={{
          ...spacings.mlMi,
          ...(isPrivacyModeEnabled ? { lineHeight: 14 } : {})
        }}
        dataSet={
          tooltipText
            ? createGlobalTooltipDataSet({
                id: 'gas-tank-pill-tooltip',
                content: tooltipText
              })
            : {}
        }
        color={shouldDisplayValue ? primaryButtonTextColor : secondaryButtonTextColor}
        weight="number_medium"
        fontSize={shouldDisplaySafeGasTankBanner ? 13 : 12}
      >
        {shouldDisplayValue ? privateValue(text, isPrivacyModeEnabled, 4) : text}
      </Text>
      {shouldDisplayOnGasTank && (
        <Text
          fontSize={shouldDisplaySafeGasTankBanner ? 13 : 12}
          color={secondaryButtonTextColor}
          style={spacings.mlMi}
        >
          {t('on Gas Tank')}
        </Text>
      )}
    </Pressable>
  )
}

export default React.memo(GasTankButton)
