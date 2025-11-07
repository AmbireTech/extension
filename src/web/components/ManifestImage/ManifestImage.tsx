import React, { useCallback, useEffect, useState } from 'react'
import { Image, ImageStyle, View, ViewStyle } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { SkeletonLoaderProps } from '@common/components/SkeletonLoader/types'
import useTheme from '@common/hooks/useTheme'
import commonStyles from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'

type Props = {
  uri?: string
  uris?: string[]
  fallback?: () => any
  size: ViewStyle['width']
  isRound?: boolean
  iconScale?: number
  containerStyle?: ViewStyle
  imageStyle?: ImageStyle
  skeletonAppearance?: SkeletonLoaderProps['appearance']
}

const ManifestImage = ({
  uri,
  uris = [],
  fallback,
  size = 64,
  isRound,
  iconScale = 1,
  containerStyle = {},
  imageStyle = {},
  skeletonAppearance
}: Props) => {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentUri, setCurrentUri] = useState({
    index: 0,
    uri: uri || uris[0]
  })
  const scaledSize = typeof size !== 'string' ? size * iconScale : size
  const roundBorderRadius = typeof scaledSize !== 'string' ? scaledSize / 2 : 50

  const onError = useCallback(() => {
    setHasError(true)

    if (uris.length && uris.length > 1 && currentUri.index < uris.length - 1) {
      setCurrentUri({
        index: currentUri.index + 1,
        uri: uris[currentUri.index + 1]
      })
    }
  }, [currentUri.index, uris])

  const onLoadEnd = useCallback(() => setIsLoading(false), [])

  useEffect(() => {
    if (!uris.length && !uri) {
      setIsLoading(false)
      setHasError(true)
    }
  }, [uri, uris.length])

  return (
    <View
      style={[
        flexboxStyles.alignCenter,
        flexboxStyles.justifyCenter,
        commonStyles.borderRadiusPrimary,
        commonStyles.hidden,
        !!isRound && { borderRadius: roundBorderRadius },
        { width: size, height: size },
        containerStyle
      ]}
    >
      {isLoading && (
        <SkeletonLoader
          width={scaledSize}
          height={scaledSize}
          style={{
            position: 'absolute',
            zIndex: 3
          }}
          appearance={skeletonAppearance}
        />
      )}
      {!isLoading && hasError && !!fallback && fallback()}
      {!!currentUri.uri && !hasError && (
        <Image
          source={{ uri: currentUri.uri }}
          onError={onError}
          onLoadEnd={onLoadEnd}
          resizeMode="contain"
          style={[
            {
              height: scaledSize,
              width: scaledSize,
              backgroundColor: theme.primaryBackground,
              opacity: isLoading ? 0 : 1
            },
            !!isRound && { borderRadius: roundBorderRadius },
            imageStyle
          ]}
        />
      )}
    </View>
  )
}

export default React.memo(ManifestImage)
