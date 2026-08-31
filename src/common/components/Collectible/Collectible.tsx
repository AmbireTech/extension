import React, { FC } from 'react'
import { Animated, Pressable, View, ViewStyle } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import { SelectedCollectible } from '@common/components/CollectibleModal'
import ManifestImage from '@common/components/ManifestImage'
import { useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { NFT_CDN_URL } from '@env'
import ImageIcon from '@web/assets/svg/ImageIcon'

import styles, { COLLECTIBLE_SIZE } from './styles'

/** The last price a collectible was traded at, in the currency it was traded in */
const formatCollectiblePrice = ({
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

type Props = {
  style?: ViewStyle
  id: bigint
  collectionData: {
    name?: string
    address: string
    chainId: bigint
    priceIn?: {
      baseCurrency: string
      price: number
    } | null
  }
  openCollectibleModal?: (collectible: SelectedCollectible) => void
  size?: number
  /** Applied to both the image and its container, which clips it */
  borderRadius?: number
  networks: Network[]
}

const Collectible: FC<Props> = ({
  id,
  collectionData,
  openCollectibleModal,
  size = COLLECTIBLE_SIZE,
  style,
  borderRadius = BORDER_RADIUS_PRIMARY,
  networks
}) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'scaleX',
    values: {
      from: 1,
      to: 1.15
    }
  })

  const network = networks.find((n) => n.chainId === collectionData.chainId)

  const imageUrl = `${NFT_CDN_URL}/proxy?rpc=${network?.rpcUrls[0]}&contract=${collectionData.address}&id=${id}&chain_id=${network?.chainId}`

  return (
    <Pressable
      testID="collectible-picture"
      style={{
        width: size,
        height: size,
        ...styles.container,
        borderRadius,
        ...style
      }}
      onPress={() => {
        if (!openCollectibleModal) return

        // The portfolio has no name for collections it can't read it from
        const collectionName = collectionData.name || shortenAddress(collectionData.address, 13)

        openCollectibleModal({
          address: collectionData.address,
          name: `${collectionName} #${id}`,
          id,
          chainId: collectionData.chainId,
          lastPrice: collectionData.priceIn ? formatCollectiblePrice(collectionData.priceIn) : '',
          image: imageUrl,
          collectionName
        })
      }}
      {...bindAnim}
    >
      <Animated.View
        style={[
          flexbox.flex1,
          {
            transform: [{ scale: animStyle.scaleX as number }],
            backgroundColor: theme.secondaryBackground
          }
        ]}
      >
        <ManifestImage
          uri={imageUrl}
          size="100%"
          skeletonAppearance="primaryBackground"
          fallback={() => (
            <View
              // Matches the placeholder of a collection without an image
              style={[
                flexbox.flex1,
                flexbox.center,
                { backgroundColor: theme.neutral200, width: '100%' }
              ]}
            >
              <ImageIcon
                color={theme.secondaryText}
                width={COLLECTIBLE_SIZE / 2}
                height={COLLECTIBLE_SIZE / 2}
              />
            </View>
          )}
          imageStyle={{ ...styles.image, borderRadius }}
        />
      </Animated.View>
    </Pressable>
  )
}

export default React.memo(Collectible)
