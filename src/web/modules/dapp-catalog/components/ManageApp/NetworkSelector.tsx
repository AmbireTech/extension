import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, ScrollView, View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'
import CheckIcon from '@common/assets/svg/CheckIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ChevronDownIcon from '@legends/common/assets/svg/ChevronDownIcon'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

const NetworkOption = ({
  onSelectNetwork,
  network,
  isSelectedNetwork
}: {
  onSelectNetwork: (chainId: bigint) => void
  network: Network
  isSelectedNetwork: boolean
}) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.primaryBackground
    }
  })

  return (
    <AnimatedPressable
      {...bindAnim}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.phTy,
        spacings.pvTy,
        animStyle,
        {
          borderRadius: 8
        }
      ]}
      onPress={() => {
        onSelectNetwork(network.chainId)
      }}
    >
      <View style={flexbox.directionRow}>
        <NetworkIcon id={network.chainId.toString()} size={20} />
        <Text fontSize={14} weight="medium" style={[spacings.mlTy, spacings.mrMd]}>
          {network.name}
        </Text>
      </View>
      {isSelectedNetwork && <CheckIcon width={16} height={16} color={theme.successDecorative} />}
    </AnimatedPressable>
  )
}

const NetworkSelector = ({ dapp, isAbove = false }: { dapp: Dapp; isAbove?: boolean }) => {
  const { dispatch } = useBackgroundService()

  const { networks } = useNetworksControllerState()
  const [isExpanded, setIsExpanded] = useState(false)
  const { theme } = useTheme()
  const { t } = useTranslation()

  const heightAnim = useRef(new Animated.Value(0)).current

  const networkData = networks.filter((n) => Number(n.chainId) === dapp.chainId)[0]

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.primaryBackground
    }
  })

  const onSelectNetwork = useCallback(
    (chainId: bigint) => {
      dispatch({
        type: 'CHANGE_CURRENT_DAPP_NETWORK',
        params: {
          id: dapp.id,
          chainId: Number(chainId)
        }
      })
      setIsExpanded(false)
    },
    [dispatch, dapp.id]
  )

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 12
    }).start()
  }, [isExpanded, heightAnim])

  const maxHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320]
  })

  const networkList = (
    <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
      <ScrollView style={{ maxHeight: 320 }}>
        {networks.map((network) => (
          <NetworkOption
            onSelectNetwork={onSelectNetwork}
            key={network.chainId}
            network={network}
            isSelectedNetwork={dapp.chainId === Number(network.chainId)}
          />
        ))}
      </ScrollView>
    </Animated.View>
  )

  return (
    <View>
      {isAbove && networkList}
      <AnimatedPressable
        {...bindAnim}
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.phTy,
          spacings.pvTy,
          animStyle,
          { borderRadius: 8 }
        ]}
        onPress={() => {
          setIsExpanded((prev) => !prev)
        }}
      >
        <View style={flexbox.directionRow}>
          {networkData ? (
            <NetworkIcon
              id={networkData.chainId.toString()}
              size={20}
              // Force a re-render of the NetworkIcon when the chainId changes to update the icon accordingly
              key={networkData.chainId.toString()}
            />
          ) : (
            <NetworksIcon width={20} height={20} />
          )}
          <Text fontSize={14} weight="medium" style={spacings.mlTy}>
            {networkData?.name || t('Unknown Network')}
          </Text>
        </View>
        <ChevronDownIcon
          width={16}
          height={16}
          color={theme.iconPrimary}
          style={{
            transform: [{ rotate: isExpanded ? '180deg' : '0deg' }]
          }}
        />
      </AnimatedPressable>
      {!isAbove && networkList}
    </View>
  )
}

export default NetworkSelector
