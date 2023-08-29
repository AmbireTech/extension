import { NETWORKS } from 'ambire-common/src/constants/networks'
import React from 'react'

import AndromedaLogo from '@common/assets/svg/AndromedaLogo'
import AndromedaMonochromeIcon from '@common/assets/svg/AndromedaMonochromeIcon'
import ArbitrumLogo from '@common/assets/svg/ArbitrumLogo'
import ArbitrumMonochromeIcon from '@common/assets/svg/ArbitrumMonochromeIcon'
import AvalancheLogo from '@common/assets/svg/AvalancheLogo'
import AvalancheMonochromeIcon from '@common/assets/svg/AvalancheMonochromeIcon'
import BaseLogo from '@common/assets/svg/BaseLogo'
import BaseMonochromeIcon from '@common/assets/svg/BaseMonochromeIcon'
import BinanceLogo from '@common/assets/svg/BinanceLogo'
import BinanceMonochromeIcon from '@common/assets/svg/BinanceMonochromeIcon'
import EthereumLogo from '@common/assets/svg/EthereumLogo'
import EthereumMonochromeIcon from '@common/assets/svg/EthereumMonochromeIcon'
import FantomLogo from '@common/assets/svg/FantomLogo'
import FantomMonochromeIcon from '@common/assets/svg/FantomMonochromeIcon'
import GnosisLogo from '@common/assets/svg/GnosisLogo'
import GnosisMonochromeIcon from '@common/assets/svg/GnosisMonochromeIcon'
import KCCKuCoinLogo from '@common/assets/svg/KCCKuCoinLogo'
import KCCKuCoinMonochromeIcon from '@common/assets/svg/KCCKuCoinMonochromeIcon'
import MoonbeamLogo from '@common/assets/svg/MoonbeamLogo'
import MoonbeamMonochromeIcon from '@common/assets/svg/MoonbeamMonochromeIcon'
import MoonriverLogo from '@common/assets/svg/MoonriverLogo'
import MoonriverMonochromeIcon from '@common/assets/svg/MoonriverMonochromeIcon'
import OkcLogo from '@common/assets/svg/OkcLogo'
import OkcMonochromeIcon from '@common/assets/svg/OkcMonochromeIcon'
import OptimismLogo from '@common/assets/svg/OptimismLogo'
import OptimismMonochromeIcon from '@common/assets/svg/OptimismMonochromeIcon'
import PolygonLogo from '@common/assets/svg/PolygonLogo'
import PolygonMonochromeIcon from '@common/assets/svg/PolygonMonochromeIcon'

export type NetworkIconNameType = keyof typeof NETWORKS

type Props = {
  name: NetworkIconNameType
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
  [NETWORKS.moonriver]: MoonriverLogo,
  [NETWORKS.arbitrum]: ArbitrumLogo,
  [NETWORKS.optimism]: OptimismLogo,
  [NETWORKS.base]: BaseLogo,
  [NETWORKS.gnosis]: GnosisLogo,
  [NETWORKS.kucoin]: KCCKuCoinLogo,
  [NETWORKS.andromeda]: AndromedaLogo,
  [NETWORKS.okc]: OkcLogo
}

const iconsMonochrome: { [key: string]: any } = {
  [NETWORKS.ethereum]: EthereumMonochromeIcon,
  [NETWORKS.polygon]: PolygonMonochromeIcon,
  [NETWORKS.avalanche]: AvalancheMonochromeIcon,
  [NETWORKS['binance-smart-chain']]: BinanceMonochromeIcon,
  [NETWORKS.fantom]: FantomMonochromeIcon,
  [NETWORKS.moonbeam]: MoonbeamMonochromeIcon,
  [NETWORKS.moonriver]: MoonriverMonochromeIcon,
  [NETWORKS.arbitrum]: ArbitrumMonochromeIcon,
  [NETWORKS.optimism]: OptimismMonochromeIcon,
  [NETWORKS.base]: BaseMonochromeIcon,
  [NETWORKS.gnosis]: GnosisMonochromeIcon,
  [NETWORKS.kucoin]: KCCKuCoinMonochromeIcon,
  [NETWORKS.andromeda]: AndromedaMonochromeIcon,
  [NETWORKS.okc]: OkcMonochromeIcon
}

const NetworkIcon = ({ name, type = 'regular', ...rest }: Props) => {
  const Icon = type === 'monochrome' ? iconsMonochrome[name] : icons[name]

  return Icon ? <Icon {...rest} /> : null
}

export default NetworkIcon
