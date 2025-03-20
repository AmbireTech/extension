import React, { useCallback, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import RewardsIcon from '@common/assets/svg/RewardsIcon'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

export type NetworkIconIdType = string | 'gasTank' | 'rewards'

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
  const { networks } = useNetworksControllerState()

  const networkName = useMemo(() => {
    if (id === '56') return 'binance-smart-chain'

    return (networks.find((n) => n.chainId.toString() === id)?.name || id).toLowerCase()
  }, [id, networks])

  const network = useMemo(() => {
    return benzinNetwork ?? networks.find((n) => n.name.toLowerCase() === networkName)
  }, [networkName, networks, benzinNetwork])

  const iconUrls = useMemo(
    () => [
      ...((network as Network)?.iconUrls || []),
      `https://icons.llamao.fi/icons/chains/rsz_${networkName.split(/\s+/)[0].toLowerCase()}.jpg`,
      `https://icons.llamao.fi/icons/chains/rsz_${network?.nativeAssetSymbol?.toLowerCase()}.jpg`,
      `https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/64/${networkName.toLowerCase()}.png`,
      `https://github.com/ErikThiart/cryptocurrency-icons/tree/master/64/${networkName.toLowerCase()}.png`
    ],
    [networkName, network]
  )

  const iconScale = useMemo(() => scale || (size < 28 ? 0.8 : 0.6), [size, scale])

  const { theme } = useTheme()
  const Icon = icons[networkName]

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
            {networkName[0].toUpperCase()}
          </Text>
        </View>
      </View>
    ),
    [iconScale, networkName, size, style, theme]
  )

  return (
    <>
      <View
        // @ts-ignore
        dataSet={{
          tooltipId: `${networkName}`,
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
          id={networkName}
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
