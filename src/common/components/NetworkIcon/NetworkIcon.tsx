import React, { useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { CustomNetwork } from '@ambire-common/interfaces/settings'
import AndromedaLogo from '@common/assets/svg/AndromedaLogo'
import AndromedaMonochromeIcon from '@common/assets/svg/AndromedaMonochromeIcon'
import ArbitrumLogo from '@common/assets/svg/ArbitrumLogo'
import ArbitrumMonochromeIcon from '@common/assets/svg/ArbitrumMonochromeIcon'
import AvalancheLogo from '@common/assets/svg/AvalancheLogo'
import AvalancheMonochromeIcon from '@common/assets/svg/AvalancheMonochromeIcon'
import BinanceLogo from '@common/assets/svg/BinanceLogo'
import BinanceMonochromeIcon from '@common/assets/svg/BinanceMonochromeIcon'
import EthereumLogo from '@common/assets/svg/EthereumLogo'
import EthereumMonochromeIcon from '@common/assets/svg/EthereumMonochromeIcon'
import FantomLogo from '@common/assets/svg/FantomLogo'
import FantomMonochromeIcon from '@common/assets/svg/FantomMonochromeIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import GnosisLogo from '@common/assets/svg/GnosisLogo'
import GnosisMonochromeIcon from '@common/assets/svg/GnosisMonochromeIcon'
import KCCKuCoinLogo from '@common/assets/svg/KCCKuCoinLogo'
import KCCKuCoinMonochromeIcon from '@common/assets/svg/KCCKuCoinMonochromeIcon'
import MoonbeamLogo from '@common/assets/svg/MoonbeamLogo'
import MoonbeamMonochromeIcon from '@common/assets/svg/MoonbeamMonochromeIcon'
import MoonriverLogo from '@common/assets/svg/MoonriverLogo'
import MoonriverMonochromeIcon from '@common/assets/svg/MoonriverMonochromeIcon'
import OptimismLogo from '@common/assets/svg/OptimismLogo'
import OptimismMonochromeIcon from '@common/assets/svg/OptimismMonochromeIcon'
import PolygonLogo from '@common/assets/svg/PolygonLogo'
import PolygonMonochromeIcon from '@common/assets/svg/PolygonMonochromeIcon'
import RewardsIcon from '@common/assets/svg/RewardsIcon'
import Text from '@common/components/Text'
import { NETWORKS } from '@common/constants/networks'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'

export type NetworkIconNameType = keyof typeof NETWORKS | 'gasTank' | 'rewards'

type Props = {
  name: NetworkIconNameType
  uris?: string[]
  size?: number
  type?: 'regular' | 'monochrome'
  style?: ViewStyle
  [key: string]: any
}

const icons: { [key: string]: any } = {
  [NETWORKS.ethereum]: EthereumLogo,
  [NETWORKS.rinkeby]: EthereumLogo,
  [NETWORKS.polygon]: PolygonLogo,
  [NETWORKS.avalanche]: AvalancheLogo,
  [NETWORKS['binance-smart-chain']]: BinanceLogo,
  [NETWORKS.fantom]: FantomLogo,
  [NETWORKS.moonbeam]: MoonbeamLogo,
  [NETWORKS.moonriver]: MoonriverLogo,
  [NETWORKS.arbitrum]: ArbitrumLogo,
  [NETWORKS.optimism]: OptimismLogo,
  [NETWORKS.gnosis]: GnosisLogo,
  [NETWORKS.kucoin]: KCCKuCoinLogo,
  [NETWORKS.andromeda]: AndromedaLogo,
  gasTank: GasTankIcon,
  rewards: RewardsIcon
}

const iconsMonochrome: { [key: string]: any } = {
  [NETWORKS.ethereum]: EthereumMonochromeIcon,
  [NETWORKS.rinkeby]: EthereumMonochromeIcon,
  [NETWORKS.polygon]: PolygonMonochromeIcon,
  [NETWORKS.avalanche]: AvalancheMonochromeIcon,
  [NETWORKS['binance-smart-chain']]: BinanceMonochromeIcon,
  [NETWORKS.fantom]: FantomMonochromeIcon,
  [NETWORKS.moonbeam]: MoonbeamMonochromeIcon,
  [NETWORKS.moonriver]: MoonriverMonochromeIcon,
  [NETWORKS.arbitrum]: ArbitrumMonochromeIcon,
  [NETWORKS.optimism]: OptimismMonochromeIcon,
  [NETWORKS.gnosis]: GnosisMonochromeIcon,
  [NETWORKS.kucoin]: KCCKuCoinMonochromeIcon,
  [NETWORKS.andromeda]: AndromedaMonochromeIcon
}

const NetworkIcon = ({ name, uris, size = 32, type = 'regular', style = {}, ...rest }: Props) => {
  const { networks } = useSettingsControllerState()

  const network = useMemo(() => {
    return networks.find((n) => n.id === name)
  }, [name, networks])

  const iconScale = useMemo(() => (size < 28 ? 0.8 : 0.6), [size])

  if (name.startsWith('bnb')) {
    // eslint-disable-next-line no-param-reassign
    name = 'binance-smart-chain'
  }
  const Icon = type === 'monochrome' ? iconsMonochrome[name] : icons[name]
  const { theme } = useTheme()
  const DefaultIcon = () =>
    Icon ? (
      <Icon width={size} height={size} {...rest} />
    ) : (
      <View
        style={[{ width: size, height: size }, flexbox.alignCenter, flexbox.justifyCenter, style]}
      >
        <View
          style={[
            {
              width: size * iconScale,
              height: size * iconScale,
              backgroundColor: theme.primary,
              borderRadius: 50
            },
            flexbox.alignCenter,
            flexbox.justifyCenter
          ]}
        >
          <Text weight="medium" fontSize={size * 0.4} color="#fff">
            {name[0].toUpperCase()}
          </Text>
        </View>
      </View>
    )

  return (
    <View
      style={[
        flexbox.alignCenter,
        flexbox.justifyCenter,
        {
          width: size,
          height: size,
          borderRadius: 50,
          overflow: 'hidden',
          backgroundColor: theme.tertiaryBackground
        },
        style
      ]}
    >
      <ManifestImage
        uris={uris || (network as CustomNetwork)?.iconUrls || []}
        size={size}
        iconScale={iconScale}
        isRound
        fallback={() => DefaultIcon()}
      />
    </View>
  )
}

export default React.memo(NetworkIcon)
