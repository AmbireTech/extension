import React, { useCallback, useMemo } from 'react'
import { ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useHasGasTank from '@common/hooks/useHasGasTank'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getGasTankTokenDetails } from '@common/utils/getGasTankTokenDetails'

interface Props {
  onPress: () => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
}

const GasTankButton = ({ onPress, portfolio, account }: Props) => {
  const { t } = useTranslation()
  const [bindBtnAnim, btnAnimStyle] = useHover({ preset: 'opacityInverted' })
  const { hasGasTank, isViewOnly } = useHasGasTank({ account })

  const {
    state: { networks }
  } = useController('NetworksController')
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

  const text = useMemo(() => {
    if (buttonState === 'balance') return `${totalBalanceGasTankDetails.balanceUSDFormatted}`
    if (buttonState === 'topup') return t('Top up')
    if (buttonState === 'soon') return isViewOnly ? '' : t('Soon')
    if (buttonState === 'error') return t('Unavailable')

    return ''
  }, [buttonState, totalBalanceGasTankDetails.balanceUSDFormatted, isViewOnly, t])

  const tooltipText = useMemo(() => {
    if (buttonState === 'soon') {
      if (!!account?.safeCreation) return t('Not available for safe wallets, yet.')
      return t('Not available for hardware wallets, yet.')
    }

    if (buttonState === 'error') {
      return t('Unable to load Gas Tank data.')
    }

    return ''
  }, [buttonState, account?.safeCreation, t])

  if (!portfolio.isReadyToVisualize) {
    return <SkeletonLoader lowOpacity width={80} height={26} borderRadius={12} />
  }

  return (
    <AnimatedPressable
      onPress={handleOnPress}
      disabled={disabled}
      // @ts-ignore
      style={{
        ...flexbox.directionRow,
        ...flexbox.center,
        ...spacings.phSm,
        ...spacings.mrMi,
        ...btnAnimStyle,
        ...(!!tooltipText && ({ cursor: 'default' } as unknown as ViewStyle)),
        borderColor: '#FFFFFF1F',
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: '#000000',
        height: 26
      }}
      {...bindBtnAnim}
      testID={
        buttonState === 'balance' ? 'dashboard-gas-tank-balance' : 'dashboard-gas-tank-button'
      }
    >
      <GasTankIcon width={14} height={14} color="#FFFFFF" />
      <Text
        style={spacings.mlMi}
        dataSet={
          tooltipText
            ? createGlobalTooltipDataSet({
                id: tooltipText.toLowerCase().replace(/\s/g, '-'),
                content: tooltipText
              })
            : {}
        }
        color="#FFFFFF"
        weight="number_medium"
        fontSize={12}
      >
        {text}
      </Text>
    </AnimatedPressable>
  )
}

export default React.memo(GasTankButton)
