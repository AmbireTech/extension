import React from 'react'

import { Networks } from '@legends/modules/legends/types'

import ArbitrumLogo from './ArbitrumLogo'
import BaseLogo from './BaseLogo'
import BinanceSmartChainLogo from './BinanceSmartChainLogo'
import EthereumLogo from './EthereumLogo'
import OptimismLogo from './OptimismLogo'
import ScrollLogo from './ScrollLogo'

const NETWORK_ICONS: { [key in Networks]: React.ReactNode } = {
  '1': <EthereumLogo />,
  '8453': <BaseLogo />,
  '42161': <ArbitrumLogo />,
  '10': <OptimismLogo />,
  '534352': <ScrollLogo />,
  '56': <BinanceSmartChainLogo />
}
interface Props {
  chainId: Networks
}
export const NetworkIcon = ({ chainId }: Props) => {
  return <>{NETWORK_ICONS[chainId]}</>
}
