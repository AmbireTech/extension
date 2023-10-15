import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import CollectibleIcon from '@common/components/CollectibleIcon/CollectibleIcon'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

type Props = {
  tokenId: string
  network: string
  address: string
  assetImg: string
  collectionImg: string
  collectionName: string
  assetName: string
  balanceUSD: number
}

const CollectibleItem = ({
  tokenId,
  network,
  address,
  assetImg,
  collectionImg,
  collectionName,
  assetName,
  balanceUSD
}: Props) => {
  const { navigate } = useNavigation()

  const handleCollectiblePress = () => {
    navigate(ROUTES.collectible, {
      state: {
        tokenId,
        network,
        address
      }
    })
  }

  return (
    <View style={styles.itemWrapper}>
      <TouchableOpacity style={styles.item} activeOpacity={0.6} onPress={handleCollectiblePress}>
        <View style={styles.collectibleImage}>
          <CollectibleIcon uri={assetImg} />
        </View>
        <View style={[spacings.phTy, spacings.pbTy]}>
          <View
            style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, flexboxStyles.flex1]}
          >
            <CollectibleIcon
              style={styles.collectionImage}
              width={15}
              height={15}
              uri={collectionImg}
            />

            <Text numberOfLines={1} style={flexboxStyles.flex1} fontSize={10}>
              {collectionName}
            </Text>
          </View>
          <View
            style={[
              flexboxStyles.directionRow,
              spacings.ptMi,
              flexboxStyles.flex1,
              flexboxStyles.alignCenter
            ]}
          >
            <Text
              numberOfLines={1}
              weight="regular"
              fontSize={11}
              style={[flexboxStyles.flex1, spacings.mrMi]}
            >
              {assetName}
            </Text>
            <Text fontSize={10}>
              <Text fontSize={10} color={colors.heliotrope}>
                $
              </Text>
              <Text fontSize={10}>{Number(balanceUSD).toFixed(2)}</Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default React.memo(CollectibleItem)
