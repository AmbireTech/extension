import React, { FC } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import Collectible from '@common/components/Collectible'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'
import ImageIcon from '@web/assets/svg/ImageIcon'

type Props = {
  address: string
  chainId: bigint
  /** Images are per collectible, so without an id there is nothing to display */
  collectibleId?: bigint
  size?: number
  networks: Network[]
}

const DEFAULT_SIZE = 32
const BORDER_RADIUS = 20

/** Displays a collection by one of its collectibles, or a placeholder when none is known */
const CollectionThumbnail: FC<Props> = ({
  address,
  chainId,
  collectibleId,
  size = DEFAULT_SIZE,
  networks
}) => {
  const { theme } = useTheme()

  if (typeof collectibleId === 'bigint')
    return (
      <Collectible
        id={collectibleId}
        size={size}
        borderRadius={BORDER_RADIUS}
        collectionData={{ address, chainId }}
        networks={networks}
      />
    )

  return (
    <View
      style={[
        flexbox.center,
        // Matches the container of a token icon
        {
          width: size,
          height: size,
          borderRadius: BORDER_RADIUS,
          backgroundColor: theme.neutral200
        }
      ]}
    >
      <ImageIcon color={theme.secondaryText} width={size * 0.7} height={size * 0.7} />
    </View>
  )
}

export default React.memo(CollectionThumbnail)
