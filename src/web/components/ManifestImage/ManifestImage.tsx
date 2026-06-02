import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { SkeletonLoaderProps } from '@common/components/SkeletonLoader/types'
import { isWeb } from '@common/config/env'
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
  containerStyle?: StyleProp<ViewStyle>
  imageStyle?: ImageStyle
  skeletonAppearance?: SkeletonLoaderProps['appearance']
}

const getImageProxyUri = (imageUri: string) => {
  if (!isWeb) return null

  try {
    const parsedUri = new URL(imageUri)
    const isHttp = parsedUri.protocol === 'http:' || parsedUri.protocol === 'https:'

    if (!isHttp) return null

    // Web fallback: retry through an image proxy to work around browser-only loading issues (CORS/hotlinking)
    return `https://images.weserv.nl/?url=${encodeURIComponent(imageUri)}`
  } catch {
    return null
  }
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
  const uriSignature = useMemo(() => JSON.stringify([uri, ...uris]), [uri, uris])

  const imageUris = useMemo(() => {
    const rawUris = [uri, ...uris].filter((item): item is string => !!item)
    const dedupedUris = new Set<string>()
    const allUris: string[] = []

    rawUris.forEach((item) => {
      if (!dedupedUris.has(item)) {
        dedupedUris.add(item)
        allUris.push(item)
      }

      const proxiedItem = getImageProxyUri(item)

      if (proxiedItem && !dedupedUris.has(proxiedItem)) {
        dedupedUris.add(proxiedItem)
        allUris.push(proxiedItem)
      }
    })

    return allUris
  }, [uri, uris])

  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentUriIndex, setCurrentUriIndex] = useState(0)
  const currentUri = imageUris[currentUriIndex]
  const scaledSize = typeof size === 'number' ? size * iconScale : size
  const roundBorderRadius = typeof scaledSize === 'number' ? scaledSize / 2 : 50

  const onError = useCallback(() => {
    setCurrentUriIndex((prevIndex) => {
      if (prevIndex < imageUris.length - 1) {
        setHasError(false)
        setIsLoading(true)
        return prevIndex + 1
      }

      setHasError(true)
      setIsLoading(false)
      return prevIndex
    })
  }, [imageUris.length])

  const onLoad = useCallback(() => {
    setHasError(false)
  }, [])

  const onLoadEnd = useCallback(() => {
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!imageUris.length) {
      setIsLoading(false)
      setHasError(true)
      return
    }

    setCurrentUriIndex(0)
    setHasError(false)
    setIsLoading(true)
  }, [uriSignature, imageUris.length])

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
      {!!currentUri && !hasError && (
        <Image
          source={{ uri: currentUri }}
          onError={onError}
          onLoad={onLoad}
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
