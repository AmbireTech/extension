import { nanoid } from 'nanoid'
import React, { useCallback, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import RewardsIcon from '@common/assets/svg/RewardsIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import ManifestImage from '@common/components/ManifestImage'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getBundledNetworkIconUri } from '@common/utils/getBundledNetworkIconUri'

import type { NetworksController } from '@ambire-common/controllers/networks/networks'

const selectAllNetworks = (state: NetworksController) => state.allNetworks

export type NetworkIconIdType = string | 'gasTank' | 'rewards'

type Props = {
  id: NetworkIconIdType
  size?: number
  scale?: number
  style?: ViewStyle
  withTooltip?: boolean
  [key: string]: any
  benzinNetwork?: Network
  name?: string
}

const icons: { [key: string]: any } = {
  gastank: GasTankIcon,
  rewards: RewardsIcon
}

const NetworkIcon = ({
  id,
  size = 32,
  scale,
  withTooltip = true,
  style = {},
  benzinNetwork,
  name,
  ...rest
}: Props) => {
  const { state: allNetworks } = useController('NetworksController', selectAllNetworks)

  const network = useMemo(() => {
    return benzinNetwork ?? allNetworks.find((n) => n.chainId.toString() === id)
  }, [benzinNetwork, allNetworks, id])

  const networkName = useMemo(() => {
    return network?.name || name || `Chain with id ${id}`
  }, [id, name, network?.name])

  // Network icons are only ever the ones shipped with the app, so showing a network makes no
  // request to anyone. Networks that aren't bundled (like custom ones), or an OTA update running on
  // an older app build without the bundled icons, get the first-letter icon instead
  const bundledIconUri = useMemo(() => getBundledNetworkIconUri(id) ?? undefined, [id])

  const iconScale = useMemo(() => scale || 0.8, [scale])

  const { theme } = useTheme()
  const Icon = icons[networkName]

  const renderDefaultIcon = useCallback(() => {
    const firstCharOfNetworkName = networkName[0]?.toUpperCase() || '?'

    return (
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
            {firstCharOfNetworkName}
          </Text>
        </View>
      </View>
    )
  }, [iconScale, networkName, size, style, theme])

  // Ensure tooltip ID is unique per component to avoid duplicates when multiple are rendered (with same network name)
  const tooltipId = useMemo(() => `${networkName}-${nanoid(6)}`, [networkName])

  return (
    <View
      dataSet={createGlobalTooltipDataSet({
        id: tooltipId,
        content: `${network?.name}`,
        style: {
          paddingRight: SPACING_TY,
          paddingLeft: SPACING_TY,
          paddingTop: SPACING_MI,
          paddingBottom: SPACING_MI,
          fontSize: 12
        },
        hidden: !network || !withTooltip
      })}
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
          backgroundColor: theme.neutral200
        },
        style
      ]}
      // Force a rerender when the network changes to ensure the correct icon is displayed
      key={id}
    >
      {Icon ? (
        <Icon width={size} height={size} {...rest} />
      ) : (
        <ManifestImage
          uri={bundledIconUri}
          size={size}
          iconScale={iconScale}
          isRound
          fallback={() => renderDefaultIcon()}
          imageStyle={{ backgroundColor: 'transparent' }}
        />
      )}
    </View>
  )
}

export default React.memo(NetworkIcon)
