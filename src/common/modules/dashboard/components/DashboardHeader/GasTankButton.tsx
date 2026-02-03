import React, { useCallback, useMemo, useRef } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getGasTankTokenDetails } from '@common/utils/getGasTankTokenDetails'
import useHasGasTank from '@web/hooks/useHasGasTank'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

import { NEUTRAL_BACKGROUND_HOVERED } from '../../screens/styles'

type Props = {
  onPress: () => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
}

// font families are different, with different "normal" line-heights, normalize them to vertically center better
const GAS_TANK_BUTTON_LINE_HEIGHT = 14

const GasTankButton = ({ onPress, portfolio, account }: Props) => {
  const { t } = useTranslation()
  const buttonRef = useRef(null)
  const { hasGasTank, isViewOnly } = useHasGasTank({ account })
  const { theme, themeType } = useTheme()
  const { networks } = useNetworksControllerState()

  const [bindGasTankBtnAim, removeTankBtnStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: NEUTRAL_BACKGROUND_HOVERED, to: '#14183380' } // TODO: Remove hardcoded hex
  })

  const totalBalanceGasTankDetails = useMemo(
    () => getGasTankTokenDetails(portfolio, account, networks, 'amount'),
    [account, networks, portfolio]
  )

  const buttonState = useMemo(() => {
    if (totalBalanceGasTankDetails.token === null) return 'error'
    if (!hasGasTank && isViewOnly && totalBalanceGasTankDetails.balanceFormatted) return 'balance'
    if (hasGasTank && totalBalanceGasTankDetails.balanceFormatted) return 'balance'
    if (hasGasTank && !totalBalanceGasTankDetails.balanceFormatted) return 'topup'

    return 'soon'
  }, [
    hasGasTank,
    isViewOnly,
    totalBalanceGasTankDetails.balanceFormatted,
    totalBalanceGasTankDetails.token
  ])

  // Purposely don't disable the button (but block the onPress action) in
  // case of a tooltip, because it should be clickable to show the tooltip.
  const doesHaveTooltip = buttonState === 'soon' || buttonState === 'error'
  const disabled = !hasGasTank && !doesHaveTooltip
  const handleOnPress = useCallback(() => {
    if (doesHaveTooltip) return

    return onPress()
  }, [doesHaveTooltip, onPress])

  if (!portfolio.isReadyToVisualize) {
    return <SkeletonLoader lowOpacity width={160} height={28} borderRadius={8} />
  }

  return (
    <View>
      <AnimatedPressable
        ref={buttonRef}
        onPress={handleOnPress}
        disabled={disabled}
        style={{
          ...flexbox.directionRow,
          ...flexbox.center,
          ...spacings.phTy,
          ...spacings.pvMi,
          ...common.borderRadiusPrimary,
          ...removeTankBtnStyle,
          ...(!totalBalanceGasTankDetails.balanceFormatted && {
            borderWidth: 1,
            borderColor: theme.primaryLight
          }),
          ...(doesHaveTooltip && { cursor: 'default' })
        }}
        {...bindGasTankBtnAim}
        testID="dashboard-gas-tank-button"
      >
        <GasTankIcon
          width={20}
          height={20}
          color={
            themeType === THEME_TYPES.DARK
              ? theme.primaryBackgroundInverted
              : theme.primaryBackground
          }
        />
        {buttonState === 'balance' && (
          <>
            <Text
              testID="dashboard-gas-tank-balance"
              style={[spacings.mlMi, { lineHeight: GAS_TANK_BUTTON_LINE_HEIGHT }]}
              color={
                themeType === THEME_TYPES.DARK
                  ? theme.primaryBackgroundInverted
                  : theme.primaryBackground
              }
              weight="number_medium"
              fontSize={12}
            >
              {`${totalBalanceGasTankDetails.balanceUSDFormatted}`}
            </Text>
            <Text
              style={[spacings.mlMi, { opacity: 0.57, lineHeight: GAS_TANK_BUTTON_LINE_HEIGHT }]}
              fontSize={12}
              color={
                themeType === THEME_TYPES.DARK
                  ? theme.primaryBackgroundInverted
                  : theme.primaryBackground
              }
            >
              {t('on Gas Tank')}
            </Text>
          </>
        )}

        {buttonState === 'topup' && (
          <Text
            style={[spacings.mhTy]}
            color={
              themeType === THEME_TYPES.DARK
                ? theme.primaryBackgroundInverted
                : theme.primaryBackground
            }
            weight="number_bold"
            fontSize={12}
          >
            {t('Top up Gas Tank')}
          </Text>
        )}
        {buttonState === 'soon' && (
          <View
            dataSet={createGlobalTooltipDataSet({
              id: 'gas-tank-soon',
              content: t('Not available for hardware wallets yet.'),
              hidden: buttonState !== 'soon'
            })}
          >
            <Text
              style={[spacings.mhTy]}
              color={
                themeType === THEME_TYPES.DARK
                  ? theme.primaryBackgroundInverted
                  : theme.primaryBackground
              }
              weight="number_bold"
              fontSize={12}
            >
              {isViewOnly ? t('') : t('Gas Tank Soon')}
            </Text>
          </View>
        )}
        {buttonState === 'error' && (
          <View
            dataSet={createGlobalTooltipDataSet({
              id: 'gas-tank-error',
              content: t('Unable to load Gas Tank data.')
            })}
          >
            <Text
              style={[spacings.mhTy]}
              color={
                themeType === THEME_TYPES.DARK
                  ? theme.primaryBackgroundInverted
                  : theme.primaryBackground
              }
              weight="number_bold"
              fontSize={12}
            >
              {t('Gas Tank Unavailable')}
            </Text>
          </View>
        )}
      </AnimatedPressable>
    </View>
  )
}

export default React.memo(GasTankButton)
