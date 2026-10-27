import React from 'react'
import { View, ViewStyle } from 'react-native'

import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import NftImagesDisabledHint from '@common/components/NftImagesDisabledHint'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  /** The size of the icon */
  iconSize: number
  backgroundColor?: ViewStyle['backgroundColor']
  /** Explains why there is no image. Meant for placeholders big enough to fit it */
  withHint?: boolean
  /**
   * The privacy settings are not loaded yet, so it is not known whether the image is
   * disabled. Displays only the background, instead of saying it is disabled
   */
  isLoading?: boolean
}

/**
 * Displayed in place of an NFT image when the `nftImages` privacy opt-out is off,
 * because loading the image exposes the IP of the user and the NFT to the image CDN
 */
const NftImagePlaceholder = ({
  iconSize,
  backgroundColor,
  withHint = false,
  isLoading = false
}: Props) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.flex1,
        flexbox.center,
        { backgroundColor: backgroundColor ?? theme.neutral200, width: '100%' }
      ]}
    >
      {!isLoading && (
        <InvisibilityIcon color={theme.secondaryText} width={iconSize} height={iconSize} />
      )}
      {!isLoading && withHint && <NftImagesDisabledHint style={spacings.mtTy} />}
    </View>
  )
}

export default React.memo(NftImagePlaceholder)
