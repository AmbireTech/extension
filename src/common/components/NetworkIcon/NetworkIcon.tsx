import { nanoid } from 'nanoid'
import React, { useCallback, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import RewardsIcon from '@common/assets/svg/RewardsIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
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
  name?: string
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
  name,
  ...rest
}: Props) => {
  const { allNetworks } = useNetworksControllerState()

  const network = useMemo(() => {
    return benzinNetwork ?? allNetworks.find((n) => n.chainId.toString() === id)
  }, [benzinNetwork, allNetworks, id])

  const networkName = useMemo(() => {
    return network?.name || name || `Chain with id ${id}`
  }, [id, name, network?.name])

  const iconUrls = useMemo(
    () => [
      ...((network as Network)?.iconUrls || []),
      `https://icons.llamao.fi/icons/chains/rsz_${networkName.split(/\s+/)[0]?.toLowerCase()}.jpg`,
      `https://icons.llamao.fi/icons/chains/rsz_${network?.nativeAssetSymbol?.toLowerCase()}.jpg`,
      `https://raw.githubusercontent.com/ErikThiart/cryptocurrency-icons/master/64/${networkName.toLowerCase()}.png`,
      `https://github.com/ErikThiart/cryptocurrency-icons/tree/master/64/${networkName.toLowerCase()}.png`
    ],
    [networkName, network]
  )

  const iconScale = useMemo(() => scale || (size < 28 ? 0.8 : 0.6), [size, scale])

  const { theme, themeType } = useTheme()
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
          backgroundColor:
            themeType === THEME_TYPES.DARK
              ? theme.primaryBackgroundInverted
              : theme.tertiaryBackground
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
          imageStyle={themeType === THEME_TYPES.DARK ? { backgroundColor: 'transparent' } : {}}
        />
      )}
    </View>
  )
}

export default React.memo(NetworkIcon)
