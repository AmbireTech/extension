import { NETWORKS } from 'ambire-common/src/constants/networks'
import React from 'react'
import { View } from 'react-native'

import AvalancheLogo from '@assets/svg/AvalancheLogo'
import AvalancheMonochromeIcon from '@assets/svg/AvalancheMonochromeIcon'
import BinanceLogo from '@assets/svg/BinanceLogo'
import BinanceMonochromeIcon from '@assets/svg/BinanceMonochromeIcon'
import EthereumLogo from '@assets/svg/EthereumLogo'
import EthereumMonochromeIcon from '@assets/svg/EthereumMonochromeIcon'
import FantomLogo from '@assets/svg/FantomLogo'
import FantomMonochromeIcon from '@assets/svg/FantomMonochromeIcon'
import MoonbeamLogo from '@assets/svg/MoonbeamLogo'
import MoonbeamMonochromeIcon from '@assets/svg/MoonbeamMonochromeIcon'
import MoonriverLogo from '@assets/svg/MoonriverLogo'
import MoonriverMonochromeIcon from '@assets/svg/MoonriverMonochromeIcon'
import PolygonLogo from '@assets/svg/PolygonLogo'
import PolygonMonochromeIcon from '@assets/svg/PolygonMonochromeIcon'

type NameType = keyof typeof NETWORKS

type Props = {
  name: NameType
  type?: 'regular' | 'monochrome'
  [key: string]: any
}

const icons: { [key: string]: any } = {
  [NETWORKS.ethereum]: EthereumLogo,
  [NETWORKS.polygon]: PolygonLogo,
  [NETWORKS.avalanche]: AvalancheLogo,
  [NETWORKS['binance-smart-chain']]: BinanceLogo,
  [NETWORKS.fantom]: FantomLogo,
  [NETWORKS.moonbeam]: MoonbeamLogo,
  [NETWORKS.moonriver]: MoonriverLogo
}

const iconsMonochrome: { [key: string]: any } = {
  [NETWORKS.ethereum]: EthereumMonochromeIcon,
  [NETWORKS.polygon]: PolygonMonochromeIcon,
  [NETWORKS.avalanche]: AvalancheMonochromeIcon,
  [NETWORKS['binance-smart-chain']]: BinanceMonochromeIcon,
  [NETWORKS.fantom]: FantomMonochromeIcon,
  [NETWORKS.moonbeam]: MoonbeamMonochromeIcon,
  [NETWORKS.moonriver]: MoonriverMonochromeIcon
}

const NetworkIcon = ({ name, type = 'regular', ...rest }: Props) => {
  const Icon = type === 'monochrome' ? iconsMonochrome[name] : icons[name]

  return Icon ? <Icon {...rest} /> : null
}

export default NetworkIcon
