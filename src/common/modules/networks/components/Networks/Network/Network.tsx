import React, { FC, useCallback } from 'react'
import { Pressable, View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import KebabMenuIcon from '@common/assets/svg/KebabMenuIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import { AnimatedPressable, DURATIONS, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { NO_BLOCK_EXPLORER_AVAILABLE_TOOLTIP } from '@common/modules/networks/components/NetworkBottomSheet'
import getStyles from '@common/modules/networks/styles'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  chainId: bigint | string
  openBlockExplorer: (url?: string) => void
  openSettingsBottomSheet: (chainId: bigint | string) => void
  onPress: (chainId: bigint | string) => void
}

const Network: FC<Props> = ({ chainId, openBlockExplorer, openSettingsBottomSheet, onPress }) => {
  const { theme, styles } = useTheme(getStyles)
  const [bindAnim, animStyle, isHovered, triggerHovered] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: hexToRgba(theme.secondaryBackground, 0),
      to: theme.secondaryBackground
    }
  })
  const { networks } = useController('NetworksController').state
  const {
    state: { portfolio, dashboardNetworkFilter }
  } = useController('SelectedAccountController')

  const isInternalNetwork = chainId === 'rewards' || chainId === 'gasTank'
  // Doesn't have to be binded
  const [, explorerIconAnimStyle] = useCustomHover({
    property: 'opacity',
    values: { from: 0, to: 1 },
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
      style={[
        styles.network,
        isInternalNetwork ? styles.noKebabNetwork : {},
        animStyle,
        dashboardNetworkFilter === chainId && styles.highlightedNetwork
      ]}
      {...bindAnim}
    >
      <View style={[flexbox.alignCenter, flexbox.directionRow]}>
        <NetworkIcon size={28} id={chainId.toString()} />
        <Text
          style={spacings.mlTy}
          appearance={dashboardNetworkFilter === chainId ? 'primaryText' : 'secondaryText'}
          weight="medium"
        >
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
          style={[
            spacings.mlSm,
            explorerIconAnimStyle,
            (dashboardNetworkFilter === chainId || isHovered) &&
              !isInternalNetwork && { opacity: 1 }
          ]}
        >
          {({ hovered }: any) => (
            <OpenIcon
              width={24}
              height={24}
              color={hovered ? theme.primaryText : theme.iconPrimary}
              style={isBlockExplorerMissing && { opacity: 0.4 }}
            />
          )}
        </AnimatedPressable>
      </View>
      <View style={[flexbox.alignCenter, flexbox.directionRow]}>
        <Text
          weight="medium"
          appearance={dashboardNetworkFilter === chainId ? 'primaryText' : 'secondaryText'}
        >
          {`${formatDecimals(networkBalance, 'value')}` || '$-'}
        </Text>
        {!isInternalNetwork && !isMobile && (
          <Pressable
            onHoverIn={triggerHovered}
            onPress={() => openSettingsBottomSheet(chainId)}
            style={spacings.mlTy}
          >
            {({ hovered }: any) => (
              <KebabMenuIcon
                width={28}
                height={28}
                color={hovered ? theme.primaryText : theme.iconPrimary}
              />
            )}
          </Pressable>
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(Network)
