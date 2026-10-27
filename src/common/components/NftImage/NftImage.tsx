import React from 'react'
import { View, ViewStyle } from 'react-native'

import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import ManifestImage from '@common/components/ManifestImage'
import NftImagesDisabledHint from '@common/components/NftImagesDisabledHint'
import { SkeletonLoaderProps } from '@common/components/SkeletonLoader/types'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ImageIcon from '@web/assets/svg/ImageIcon'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'

const selectAreNftImagesEnabled = (state: IFeatureFlagsController) =>
  !!state.flags?.tokenAndDefiAutoDiscovery

type Props = {
  uri: string
  size: ViewStyle['width']
  /** The size of the icon displayed when there is no image, or when it fails to load */
  iconSize: number
  backgroundColor: ViewStyle['backgroundColor']
  imageStyle?: React.ComponentProps<typeof ManifestImage>['imageStyle']
  skeletonAppearance?: SkeletonLoaderProps['appearance']
  /** Explains why there is no image. Meant for images big enough to fit it */
  withHint?: boolean
}

/**
 * Displays an NFT image. Loading it exposes the IP of the user and the NFT to the image
 * provider, so it follows the same privacy opt-out as the token icons: Tokens, NFTs &
 * DeFi positions auto discovery. When that is off, no request is made and a placeholder
 * is displayed instead.
 */
const NftImage = ({
  uri,
  size,
  iconSize,
  backgroundColor,
  imageStyle,
  skeletonAppearance,
  withHint = false
}: Props) => {
  const { theme } = useTheme()
  const { state: areNftImagesEnabled } = useController(
    'FeatureFlagsController',
    selectAreNftImagesEnabled
  )

  return (
    <ManifestImage
      // Without a uri the image makes no request and displays the fallback straight away
      uri={areNftImagesEnabled ? uri : undefined}
      size={size}
      skeletonAppearance={skeletonAppearance}
      imageStyle={imageStyle}
      fallback={() => (
        <View style={[flexbox.flex1, flexbox.center, { backgroundColor, width: '100%' }]}>
          {areNftImagesEnabled ? (
            <ImageIcon color={theme.secondaryText} width={iconSize} height={iconSize} />
          ) : (
            <InvisibilityIcon color={theme.secondaryText} width={iconSize} height={iconSize} />
          )}
          {withHint && <NftImagesDisabledHint style={spacings.mtTy} />}
        </View>
      )}
    />
  )
}

export default React.memo(NftImage)
