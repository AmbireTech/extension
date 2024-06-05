import React, { useCallback, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { Network, NetworkId } from '@ambire-common/interfaces/network'
import { CustomNetwork } from '@ambire-common/interfaces/settings'
import AndromedaLogo from '@common/assets/svg/AndromedaLogo'
import ArbitrumLogo from '@common/assets/svg/ArbitrumLogo'
import AvalancheLogo from '@common/assets/svg/AvalancheLogo'
import BinanceLogo from '@common/assets/svg/BinanceLogo'
import EthereumLogo from '@common/assets/svg/EthereumLogo'
import FantomLogo from '@common/assets/svg/FantomLogo'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import GnosisLogo from '@common/assets/svg/GnosisLogo'
import KCCKuCoinLogo from '@common/assets/svg/KCCKuCoinLogo'
import MoonbeamLogo from '@common/assets/svg/MoonbeamLogo'
import MoonriverLogo from '@common/assets/svg/MoonriverLogo'
import OptimismLogo from '@common/assets/svg/OptimismLogo'
import PolygonLogo from '@common/assets/svg/PolygonLogo'
import RewardsIcon from '@common/assets/svg/RewardsIcon'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { NETWORKS } from '@common/constants/networks'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'

export type NetworkIconIdType = NetworkId | 'gasTank' | 'rewards'

type Props = {
  id: NetworkIconIdType
  uris?: string[]
  size?: number
  scale?: number
  style?: ViewStyle
  withTooltip?: boolean
  [key: string]: any
  benzinNetwork?: Network
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
  gastank: GasTankIcon,
  rewards: RewardsIcon
}

const NetworkIcon = ({
  id,
  uris,
  size = 32,
  scale,
  withTooltip = true,
  style = {},
  benzinNetwork,
  ...rest
}: Props) => {
  const { networks } = useSettingsControllerState()

  const networkId = useMemo(() => {
    if (id.startsWith('bnb')) {
      return 'binance-smart-chain'
    }

    return id.toLowerCase()
  }, [id])

  const network = useMemo(() => {
    return benzinNetwork ?? networks.find((n) => n.id === networkId)
  }, [networkId, networks, benzinNetwork])

  const iconUrls = useMemo(
    () => [
      ...((network as CustomNetwork)?.iconUrls || []),
      `https://icons.llamao.fi/icons/chains/rsz_${networkId.split(/\s+/)[0].toLowerCase()}.jpg`,
      `https://icons.llamao.fi/icons/chains/rsz_${network?.nativeAssetSymbol?.toLowerCase()}.jpg`,
      `https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/64/${networkId.toLowerCase()}.png`,
      `https://github.com/ErikThiart/cryptocurrency-icons/tree/master/64/${networkId.toLowerCase()}.png`
    ],
    [networkId, network]
  )

  const iconScale = useMemo(() => scale || (size < 28 ? 0.8 : 0.6), [size, scale])

  const { theme } = useTheme()
  const Icon = icons[networkId]

  const renderDefaultIcon = useCallback(
    () => (
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
            {networkId[0].toUpperCase()}
          </Text>
        </View>
      </View>
    ),
    [iconScale, networkId, size, style, theme]
  )

  return (
    <>
      <View
        // @ts-ignore
        dataSet={{
          tooltipId: `${networkId}`,
          tooltipContent: `${network?.name}`
        }}
        style={[
          flexbox.alignCenter,
          flexbox.justifyCenter,
          !Icon && {
            width: size,
            height: size
          },
          {
            borderRadius: 50,
            overflow: 'hidden',
            backgroundColor: theme.tertiaryBackground
          },
          style
        ]}
      >
        {Icon ? (
          <Icon width={size} height={size} {...rest} />
        ) : (
          <ManifestImage
            uris={uris || iconUrls}
            size={size}
            iconScale={iconScale}
            isRound
            fallback={() => renderDefaultIcon()}
          />
        )}
      </View>
      {!!network && withTooltip && (
        <Tooltip
          id={networkId}
          style={{
            paddingRight: SPACING_TY,
            paddingLeft: SPACING_TY,
            paddingTop: SPACING_MI,
            paddingBottom: SPACING_MI,
            fontSize: 12
          }}
        />
      )}
    </>
  )
}

export default React.memo(NetworkIcon)
