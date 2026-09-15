import React, { useMemo } from 'react'
import { View } from 'react-native'

import { WALLET_STAKING_ADDR } from '@ambire-common/consts/addresses'
import {
  getWalletAmountFromXWallet,
  getXWalletConversionText,
  WALLET_STAKING_CHAIN_ID
} from '@ambire-common/libs/walletStaking/shareValue'
import InfoIcon from '@common/assets/svg/InfoIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import type { SelectedAccountController } from '@ambire-common/controllers/selectedAccount/selectedAccount'

const selectXWalletShareValue = (state: SelectedAccountController) =>
  state.portfolio.walletStaking?.shareValue

type Props = {
  address: string
  chainId: bigint
  xWalletAmount: bigint
  tooltipId: string
}

const XWalletConversionTooltip = ({ address, chainId, xWalletAmount, tooltipId }: Props) => {
  const { theme } = useTheme()
  const { state: shareValue } = useController('SelectedAccountController', selectXWalletShareValue)
  const isXWallet =
    chainId === WALLET_STAKING_CHAIN_ID &&
    address.toLowerCase() === WALLET_STAKING_ADDR.toLowerCase()
  const tooltipContent = useMemo(() => {
    if (!isXWallet || !shareValue || shareValue <= 0n) return null

    return getXWalletConversionText(
      xWalletAmount,
      getWalletAmountFromXWallet(xWalletAmount, shareValue)
    )
  }, [isXWallet, shareValue, xWalletAmount])
  const tooltipDataSet = useMemo(
    () =>
      tooltipContent
        ? createGlobalTooltipDataSet({ id: tooltipId, content: tooltipContent })
        : undefined,
    [tooltipContent, tooltipId]
  )

  if (!tooltipContent || !tooltipDataSet) return null

  return (
    <View style={spacings.mlMi}>
      <InfoIcon
        width={16}
        height={16}
        color={theme.infoDecorative}
        dataSet={tooltipDataSet}
        accessibilityLabel={tooltipContent}
      />
    </View>
  )
}

export default React.memo(XWalletConversionTooltip)
