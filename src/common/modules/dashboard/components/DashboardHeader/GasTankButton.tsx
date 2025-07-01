import React, { useEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getGasTankTokenDetails } from '@common/utils/getGasTankTokenDetails'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

import { NEUTRAL_BACKGROUND_HOVERED } from '../../screens/styles'

type Props = {
  onPress: () => void
  onPosition: (position: { x: number; y: number; width: number; height: number }) => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
  hasGasTank: boolean
}

const GasTankButton = ({ onPress, onPosition, portfolio, account, hasGasTank }: Props) => {
  const { t } = useTranslation()
  const buttonRef = useRef(null)
  const { theme, themeType } = useTheme()
  const { networks } = useNetworksControllerState()

  const [bindGasTankBtnAim, removeTankBtnStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: NEUTRAL_BACKGROUND_HOVERED, to: '#14183380' } // TODO: Remove hardcoded hex
  })

  const totalBalanceGasTankDetails = useMemo(
    () => getGasTankTokenDetails(portfolio, account, hasGasTank, networks, 'amount'),
    [account, hasGasTank, networks, portfolio]
  )

  useEffect(() => {
    const measureButton = () => {
      if (buttonRef.current) {
        // @ts-ignore
        buttonRef.current.measure(
          (fx: number, fy: number, width: number, height: number, px: number, py: number) => {
            onPosition({ x: px, y: py, width, height })
          }
        )
      }
    }

    measureButton()

    const handleResize = () => {
      measureButton()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [onPosition])

  return (
    <View>
      <AnimatedPressable
        ref={buttonRef}
        onPress={hasGasTank ? onPress : () => {}}
        style={{
          ...flexbox.directionRow,
          ...flexbox.center,
          ...spacings.phTy,
          ...common.borderRadiusPrimary,
          ...removeTankBtnStyle,
          ...(!totalBalanceGasTankDetails.balanceFormatted && {
            borderWidth: 1,
            borderColor: theme.primaryLight
          }),
          ...{ cursor: !hasGasTank ? 'default' : 'pointer' }
        }}
        {...bindGasTankBtnAim}
        testID="dashboard-gas-tank-button"
      >
        <GasTankIcon
          width={20}
          color={
            themeType === THEME_TYPES.DARK
              ? theme.primaryBackgroundInverted
              : theme.primaryBackground
          }
        />
        {hasGasTank ? (
          totalBalanceGasTankDetails.balanceFormatted ? (
            <>
              <Text
                testID='dashboard-gas-tank-balance'
                style={[spacings.mlTy]}
                color={
                  themeType === THEME_TYPES.DARK
                    ? theme.primaryBackgroundInverted
                    : theme.primaryBackground
                }
                weight="number_bold"
                fontSize={12}
              >
                {`${totalBalanceGasTankDetails.balanceFormatted} ${
                  totalBalanceGasTankDetails.token?.symbol || ''
                }`}
              </Text>
              <Text
                style={[spacings.mlTy, { opacity: 0.57 }]}
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
          ) : (
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
          )
        ) : (
          // @ts-ignore
          <View dataSet={{ tooltipId: 'gas-tank-soon' }}>
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
              {t('Gas Tank Soon')}
            </Text>
          </View>
        )}
      </AnimatedPressable>
      <Tooltip content="Not available for hardware wallets yet." id="gas-tank-soon" />
    </View>
  )
}

export default React.memo(GasTankButton)
