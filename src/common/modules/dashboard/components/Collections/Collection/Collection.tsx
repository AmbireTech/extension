import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Collectible from '@common/components/Collectible'
import { SelectedCollectible } from '@common/components/CollectibleModal'
import NetworkIcon from '@common/components/NetworkIcon'
import { NetworkIconIdType } from '@common/components/NetworkIcon/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'

interface Props {
  address: string
  name: string
  chainId: NetworkIconIdType
  collectibles: bigint[]
  priceIn: {
    baseCurrency: string
    price: number
  }[]
  openCollectibleModal: (collectible: SelectedCollectible) => void
  networks: Network[]
}

export const formatCollectiblePrice = ({
  baseCurrency,
  price
}: {
  baseCurrency: string
  price: number
}) => {
  if (baseCurrency === 'usd') {
    return `$${formatDecimals(price)}`
  }

  // @TODO: handle other currencies
  return `${formatDecimals(price)} ${baseCurrency.toUpperCase()}`
}

const { isTab } = getUiType()

const Collection: FC<Props> = ({
  address,
  name,
  chainId,
  collectibles,
  priceIn,
  openCollectibleModal,
  networks
}) => {
  const { theme, styles } = useTheme(getStyles)

  const networkData = useMemo(() => {
    return networks.find(({ chainId: nChainId }) => chainId === nChainId.toString())
  }, [chainId, networks])

  return (
    <View style={styles.container}>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mbMd
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text testID="collection-item" fontSize={16} weight="medium">
            {name}
          </Text>
          <Text
            fontSize={12}
            appearance="secondaryText"
            style={{
              width: 20,
              height: 20,
              display: 'flex',
              ...flexbox.center,
              ...spacings.mlTy,
              ...common.borderRadiusPrimary,
              backgroundColor: theme.primaryBackground
            }}
          >
            {collectibles.length}
          </Text>
        </View>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <View
            style={{
              backgroundColor: theme.primaryBackground,
              borderRadius: 10,
              width: isTab ? 20 : 16,
              height: isTab ? 20 : 16,
              ...(isTab ? spacings.mrTy : spacings.mrMi)
            }}
          >
            <NetworkIcon
              size={isTab ? 20 : 16}
              id={(networkData && networkData.chainId.toString()) || ''}
            />
          </View>
          <Text fontSize={isTab ? 14 : 12} appearance="secondaryText">
            {networkData?.name || 'Unknown Network'}
          </Text>
        </View>
      </View>
      <View style={[flexbox.directionRow, flexbox.wrap]}>
        {collectibles.map((collectible) => (
          <Collectible
            style={{ ...spacings.mbSm, ...spacings.mrTy }}
            key={address + collectible}
            id={collectible}
            collectionData={{
              name,
              address,
              chainId: BigInt(chainId),
              priceIn: priceIn.length ? priceIn[0] : null
            }}
            openCollectibleModal={openCollectibleModal}
            networks={networks}
          />
        ))}
      </View>
    </View>
  )
}

export default React.memo(Collection)
