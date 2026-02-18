import React, { FC, memo, useCallback } from 'react'
import { Linking, Pressable, View } from 'react-native'

import useNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import InfoIcon from '@common/assets/svg/InfoIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  chainId: bigint
  marginRight?: number
  hideLinks?: boolean
}

const ChainVisualization: FC<Props> = ({ chainId, marginRight, hideLinks = false }) => {
  const { benzinNetworks, loadingBenzinNetworks = [] } = useNetworksContext()
  const {
    state: { networks }
  } = useController('NetworksController')
  const actualNetworks = networks ?? benzinNetworks
  const isNetworkLoading = loadingBenzinNetworks.includes(chainId)
  const destinationNetwork = actualNetworks.find((n) => n.chainId === chainId)

  const handleLink = useCallback(
    () => Linking.openURL(`https://chainlist.org/chain/${chainId}`),
    [chainId]
  )

  return (
    <View style={{ ...flexbox.directionRow, ...flexbox.alignCenter, marginRight }}>
      {destinationNetwork && !isNetworkLoading && (
        <>
          <NetworkIcon
            id={destinationNetwork.chainId.toString()}
            benzinNetwork={destinationNetwork}
          />
          <Text
            {...(!hideLinks && { onPress: handleLink })}
            weight="semiBold"
            style={spacings.mlMi}
          >
            {destinationNetwork.name}
          </Text>
        </>
      )}
      {!destinationNetwork && !isNetworkLoading && (
        <Text onPress={handleLink} weight="semiBold">
          {`Chain with id ${chainId}`}
        </Text>
      )}
      {isNetworkLoading && <SkeletonLoader width={140} height={20} />}
      {!hideLinks && (
        <Pressable style={spacings.mlMi} onPress={handleLink}>
          <InfoIcon width={14} height={14} />
        </Pressable>
      )}
    </View>
  )
}

export default memo(ChainVisualization)
