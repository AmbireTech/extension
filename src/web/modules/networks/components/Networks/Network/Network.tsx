import React, { FC, useCallback } from 'react'
import { Pressable, View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import KebabMenuIcon from '@common/assets/svg/KebabMenuIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, DURATIONS, useCustomHover, useMultiHover } from '@web/hooks/useHover'
import { NO_BLOCK_EXPLORER_AVAILABLE_TOOLTIP } from '@web/modules/networks/components/NetworkBottomSheet'
import getStyles from '@web/modules/networks/screens/styles'

interface Props {
  chainId: bigint | string
  openBlockExplorer: (url?: string) => void
  openSettingsBottomSheet: (chainId: bigint | string) => void
  onPress: (chainId: bigint | string) => void
}

const Network: FC<Props> = ({ chainId, openBlockExplorer, openSettingsBottomSheet, onPress }) => {
  const { theme, styles } = useTheme(getStyles)
  const { networks } = useController('NetworksController').state
  const {
    state: { portfolio, dashboardNetworkFilter }
  } = useController('SelectedAccountController')
  const [bindAnim, animStyle, isHovered, triggerHovered] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: hexToRgba(theme.secondaryBackground, 0),
        to: theme.secondaryBackground
      },
      {
        property: 'borderColor',
        from: hexToRgba(theme.primaryAccent, 0),
        to: theme.primaryAccent
      }
    ],
    forceHoveredStyle: dashboardNetworkFilter === chainId
  })
  const isInternalNetwork = chainId === 'rewards' || chainId === 'gasTank'
  // Doesn't have to be binded
  const [, explorerIconAnimStyle] = useCustomHover({
    property: 'opacity',
    values: {
      from: 0,
      to: 1
    },
    forceHoveredStyle: (dashboardNetworkFilter === chainId || isHovered) && !isInternalNetwork,
    duration: DURATIONS.REGULAR
  })

  const networkData = networks.find((n) => n.chainId.toString() === chainId)
  const isBlockExplorerMissing = !networkData?.explorerUrl
  const tooltipBlockExplorerMissingId = `tooltip-for-block-explorer-missing-${chainId}`
  const handleOpenBlockExplorer = useCallback(async () => {
    if (isBlockExplorerMissing) return

    await openBlockExplorer(networkData?.explorerUrl)
  }, [networkData, openBlockExplorer, isBlockExplorerMissing])

  const networkBalance = portfolio.balancePerNetwork[chainId.toString()] || 0
  let networkName = networkData?.name

  if (chainId === 'rewards') {
    networkName = 'Ambire Rewards'
  } else if (chainId === 'gasTank') {
    networkName = 'Gas Tank'
  }

  const handleOnPress = useCallback(() => {
    onPress(chainId)
  }, [chainId, onPress])

  return (
    <AnimatedPressable
      key={chainId.toString()}
      onPress={handleOnPress}
      style={[styles.network, isInternalNetwork ? styles.noKebabNetwork : {}, animStyle]}
      {...bindAnim}
    >
      <View style={[flexbox.alignCenter, flexbox.directionRow]}>
        <NetworkIcon size={32} id={chainId.toString()} />
        <Text style={spacings.mlTy} fontSize={16}>
          {networkName}
        </Text>
        <AnimatedPressable
          // Bind the parent animation so its hover state doesn't get lost
          // when hovering over the explorer icon
          onHoverIn={triggerHovered}
          onPress={handleOpenBlockExplorer}
          dataSet={createGlobalTooltipDataSet({
            id: tooltipBlockExplorerMissingId,
            content: NO_BLOCK_EXPLORER_AVAILABLE_TOOLTIP,
            hidden: !isBlockExplorerMissing
          })}
          style={[spacings.mlSm, explorerIconAnimStyle]}
        >
          {({ hovered }: any) => (
            <OpenIcon
              width={16}
              height={16}
              color={hovered ? theme.primaryText : theme.secondaryText}
              style={isBlockExplorerMissing && { opacity: 0.4 }}
            />
          )}
        </AnimatedPressable>
      </View>
      <View style={[flexbox.alignCenter, flexbox.directionRow]}>
        <Text fontSize={dashboardNetworkFilter === chainId ? 20 : 16} weight="semiBold">
          {`${formatDecimals(networkBalance, 'value')}` || '$-'}
        </Text>
        {!isInternalNetwork && (
          <Pressable
            onHoverIn={triggerHovered}
            onPress={() => openSettingsBottomSheet(chainId)}
            style={spacings.mlSm}
          >
            {({ hovered }: any) => (
              <KebabMenuIcon
                width={16}
                height={16}
                color={hovered ? theme.primaryText : theme.secondaryText}
              />
            )}
          </Pressable>
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(Network)
