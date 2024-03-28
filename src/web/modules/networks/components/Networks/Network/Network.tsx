import React, { FC, useMemo } from 'react'
import { Pressable, View } from 'react-native'

import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import KebabMenuIcon from '@common/assets/svg/KebabMenuIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation/useNavigation.web'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import formatDecimals from '@common/utils/formatDecimals'
import { AnimatedPressable, DURATIONS, useCustomHover, useMultiHover } from '@web/hooks/useHover'
import useMainControllerState from '@web/hooks/useMainControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import getStyles from '@web/modules/networks/screens/styles'

interface Props {
  networkId: NetworkDescriptor['id']
  filterByNetworkId: NetworkDescriptor['id'] | null
  openBlockExplorer: (url?: string) => void
  openSettingsBottomSheet: (networkId: NetworkDescriptor['id']) => void
}

const Network: FC<Props> = ({
  networkId,
  filterByNetworkId,
  openBlockExplorer,
  openSettingsBottomSheet
}) => {
  const { navigate } = useNavigation()
  const { theme, styles } = useTheme(getStyles)
  const { networks } = useSettingsControllerState()
  const { selectedAccount } = useMainControllerState()
  const portfolioControllerState = usePortfolioControllerState()
  const [bindAnim, animStyle, isHovered, triggerHover] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: `${String(theme.secondaryBackground)}00`,
        to: theme.secondaryBackground
      },
      {
        property: 'borderColor',
        from: `${String(theme.secondaryBorder)}00`,
        to: theme.secondaryBorder
      }
    ],
    forceHoveredStyle: filterByNetworkId === networkId
  })
  const isInternalNetwork = networkId === 'rewards' || networkId === 'gasTank'
  // Doesn't have to be binded
  const [, explorerIconAnimStyle] = useCustomHover({
    property: 'opacity',
    values: {
      from: 0,
      to: 1
    },
    forceHoveredStyle: (isHovered || filterByNetworkId === networkId) && !isInternalNetwork,
    duration: DURATIONS.REGULAR
  })

  const portfolioByNetworks = useMemo(
    () => (selectedAccount ? portfolioControllerState.state.latest[selectedAccount] : {}),
    [selectedAccount, portfolioControllerState.state.latest]
  )

  const navigateAndFilterDashboard = () => {
    navigate(WEB_ROUTES.dashboard, {
      state: {
        filterByNetworkId: networkId
      }
    })
  }

  const networkData = networks.find((network) => network.id === networkId)
  const networkBalance = portfolioByNetworks[networkId]?.result?.total
  let networkName = networkData?.name

  if (networkId === 'rewards') {
    networkName = 'Ambire Rewards'
  } else if (networkId === 'gasTank') {
    networkName = 'Gas Tank'
  }

  return (
    <AnimatedPressable
      key={networkId}
      onPress={navigateAndFilterDashboard}
      style={[styles.network, isInternalNetwork ? styles.noKebabNetwork : {}, animStyle]}
      {...bindAnim}
    >
      <View style={[flexbox.alignCenter, flexbox.directionRow]}>
        <NetworkIcon size={32} id={networkId} />
        <Text style={spacings.mlMi} fontSize={16}>
          {networkName}
        </Text>
        <AnimatedPressable
          onPress={async () => {
            await openBlockExplorer(networkData?.explorerUrl)
          }}
          style={[spacings.mlSm, explorerIconAnimStyle]}
          onHoverIn={triggerHover}
        >
          {({ hovered }: any) => (
            <OpenIcon
              width={16}
              height={16}
              color={hovered ? theme.primaryText : theme.secondaryText}
            />
          )}
        </AnimatedPressable>
      </View>
      <View style={[flexbox.alignCenter, flexbox.directionRow]}>
        <Text fontSize={filterByNetworkId === networkId ? 20 : 16} weight="semiBold">
          {`$${formatDecimals(Number(networkBalance?.usd || 0))}` || '$-'}
        </Text>
        {!isInternalNetwork && (
          <Pressable
            onHoverIn={triggerHover}
            onPress={() => openSettingsBottomSheet(networkId)}
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

export default Network
