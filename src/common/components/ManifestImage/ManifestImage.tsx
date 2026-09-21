import React, { useCallback, useMemo, useState } from 'react'
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native'
import { SvgUri } from 'react-native-svg'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { SkeletonLoaderProps } from '@common/components/SkeletonLoader/types'
import { isMobile } from '@common/config/env'
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
  hideOnError?: boolean
}

// Stable, so a caller that passes a single `uri` does not hand the fallback chain a new
// list on every render.
const NO_URIS: string[] = []

const ManifestImage = ({
  uri,
  uris = NO_URIS,
  fallback,
  size = 64,
  isRound,
  iconScale = 1,
  containerStyle = {},
  imageStyle = {},
  skeletonAppearance,
  hideOnError = false
}: Props) => {
  const { theme } = useTheme()

  const targetUri = uri || uris[0]

  /**
   * `settledUri` is which uri finished loading, rather than whether one did. React Native
   * starts no load - and so fires no event - for a source it was not asked to change, so a
   * plain loading flag can be put back to true with nothing left to ever clear it.
   */
  const [load, setLoad] = useState(() => ({
    target: targetUri,
    index: 0,
    uri: targetUri,
    settledUri: undefined as string | undefined,
    hasError: !targetUri
  }))

  // Adjusted while rendering rather than from an effect, so a changed uri restarts the
  // load in this render instead of one commit behind it.
  if (load.target !== targetUri) {
    setLoad({
      target: targetUri,
      index: 0,
      uri: targetUri,
      settledUri: undefined,
      hasError: !targetUri
    })
  }

  const { uri: currentUri, hasError } = load
  const isLoading = !hasError && !!currentUri && currentUri !== load.settledUri
  const scaledSize = typeof size === 'number' ? size * iconScale : size
  const roundBorderRadius = typeof scaledSize === 'number' ? scaledSize / 2 : 50
  const svgSize = typeof scaledSize === 'number' ? scaledSize : '100%'

  // React Native's Image can't render SVGs, so on mobile they go through SvgUri
  const shouldRenderAsSvg = useMemo(() => {
    if (!isMobile) return false

    const lowercasedUri = currentUri?.toLowerCase()

    return !!lowercasedUri && (lowercasedUri.endsWith('.svg') || lowercasedUri.includes('.svg?'))
  }, [currentUri])

  const onError = useCallback(() => {
    setLoad((prev) => {
      const nextIndex = prev.index + 1
      // A single `uri` has nothing to fall back to. A list of them is a chain of fallbacks,
      // so only running out of it is a failure - and saying so any earlier is what kept the
      // chain from ever being tried, since the image is unmounted as soon as `hasError` is.
      const nextUri = uri ? undefined : uris[nextIndex]

      if (!nextUri) return { ...prev, hasError: true }

      return { ...prev, index: nextIndex, uri: nextUri }
    })
  }, [uri, uris])

  // Settles the uri it was rendered for, not whichever is current: React Native fires this
  // on a failure too, and by then `onError` may have moved on to one that has not loaded.
  const onLoadEnd = useCallback(() => {
    setLoad((prev) => (prev.uri === currentUri ? { ...prev, settledUri: currentUri } : prev))
  }, [currentUri])

  if (hideOnError && hasError && !fallback) return null

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
      {hasError && !!fallback && fallback()}
      {!!currentUri && !hasError && shouldRenderAsSvg && (
        <SvgUri
          uri={currentUri}
          width={svgSize}
          height={svgSize}
          onError={onError}
          onLoad={onLoadEnd}
          style={{ opacity: isLoading ? 0 : 1 }}
        />
      )}
      {!!currentUri && !hasError && !shouldRenderAsSvg && (
        <Image
          source={{ uri: currentUri }}
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
