import React, { useCallback, useMemo, useRef } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import { getGasTankTokenDetails } from '@common/utils/getGasTankTokenDetails'
import useHasGasTank from '@web/hooks/useHasGasTank'

import OverviewButton from './OverviewButton'

type Props = {
  onPress: () => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
}

const GasTankButton = ({ onPress, portfolio, account }: Props) => {
  const { t } = useTranslation()
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

  const tooltip = useMemo(() => {
    if (buttonState === 'soon') {
      return t('Not available for hardware wallets yet.')
    }

    if (buttonState === 'error') {
      return t('Unable to load Gas Tank data.')
    }

    return ''
  }, [buttonState, t])

  return (
    <OverviewButton
      onPress={handleOnPress}
      renderIcon={() => <GasTankIcon width={14} height={14} color="#FFFFFF" />}
      text={text}
      tooltipText={tooltip}
      testID={
        buttonState === 'balance' ? 'dashboard-gas-tank-balance' : 'dashboard-gas-tank-button'
      }
      disabled={disabled}
      isLoading={!portfolio.isReadyToVisualize}
      style={spacings.mrMi}
    />
  )
}

export default React.memo(GasTankButton)
