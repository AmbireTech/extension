import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ImageProps, View, ViewStyle } from 'react-native'

import { networks as predefinedNetworks } from '@ambire-common/consts/networks'
import MissingTokenIcon from '@common/assets/svg/MissingTokenIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import useTheme from '@common/hooks/useTheme'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { checkIfImageExists } from '@common/utils/checkIfImageExists'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

import SkeletonLoader from '../SkeletonLoader'
import { SkeletonLoaderProps } from '../SkeletonLoader/types'
import getStyles from './styles'

interface Props extends Partial<ImageProps> {
  networkId?: string
  chainId?: number
  address?: string
  containerStyle?: ViewStyle
  withContainer?: boolean
  withNetworkIcon?: boolean
  containerWidth?: number
  containerHeight?: number
  width?: number
  height?: number
  onGasTank?: boolean
  networkSize?: number
  uri?: string
  skeletonAppearance?: SkeletonLoaderProps['appearance']
}

enum UriStatus {
  UNKNOWN = 'UNKNOWN',
  IMAGE_MISSING = 'IMAGE_MISSING',
  IMAGE_EXISTS = 'IMAGE_EXISTS'
}

const TokenIcon: React.FC<Props> = ({
  networkId = '',
  chainId,
  address = '',
  uri: fallbackUri,
  withContainer = false,
  withNetworkIcon = true,
  containerWidth = 34,
  containerHeight = 34,
  containerStyle,
  width = 20,
  height = 20,
  onGasTank = false,
  networkSize = 14,
  skeletonAppearance = 'primaryBackground',
  ...props
}) => {
  const { styles } = useTheme(getStyles)
  const { networks } = useNetworksControllerState()
  const [uriStatus, setUriStatus] = useState<UriStatus>(UriStatus.UNKNOWN)
  const [imageUrl, setImageUrl] = useState<string | undefined>()

  const network = useMemo(
    () =>
      networks
        ? networks.find((net) => net.id === networkId || Number(net.chainId) === chainId)
        : predefinedNetworks.find((net) => net.id === networkId),
    [networkId, chainId, networks]
  )

  const handleImageLoaded = useCallback(() => setUriStatus(UriStatus.IMAGE_EXISTS), [])
  const attemptToLoadFallbackImage = useCallback(async () => {
    if (fallbackUri) {
      const doesFallbackUriImageExists = await checkIfImageExists(fallbackUri)
      if (doesFallbackUriImageExists) {
        setImageUrl(fallbackUri)
        setUriStatus(UriStatus.IMAGE_EXISTS)
        return
      }
    }

    setUriStatus(UriStatus.IMAGE_MISSING)
    setImageUrl(undefined)
  }, [fallbackUri])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      const hasAmbireUriRequiredData = !!(network?.platformId && address)
      if (hasAmbireUriRequiredData) {
        const ambireUri = `https://cena.ambire.com/iconProxy/${network.platformId}/${address}`
        // Skip checking if the this image exists for optimizing network calls.
        // Although the `checkIfImageExists` only retrieves headers (which is
        // quick), in the cast majority of cases, the (default) ambire URI will exist.
        // const doesAmbireUriImageExists = await checkIfImageExists(ambireUri)
        setImageUrl(ambireUri)
        setUriStatus(UriStatus.IMAGE_EXISTS)
        return
      }

      await attemptToLoadFallbackImage()
    })()
  }, [address, network?.platformId, fallbackUri, attemptToLoadFallbackImage])

  const memoizedContainerStyle = useMemo(
    () => [
      containerStyle,
      {
        width: withContainer ? containerWidth : width,
        height: withContainer ? containerHeight : height
      },
      withContainer && styles.withContainerStyle
    ],
    [
      containerStyle,
      withContainer,
      containerWidth,
      width,
      containerHeight,
      height,
      styles.withContainerStyle
    ]
  )

  return (
    <View style={memoizedContainerStyle}>
      {uriStatus === UriStatus.UNKNOWN ? (
        <SkeletonLoader
          width={width}
          height={height}
          style={styles.loader}
          appearance={skeletonAppearance}
        />
      ) : uriStatus === UriStatus.IMAGE_MISSING ? (
        <MissingTokenIcon
          withRect={withContainer}
          width={withContainer ? containerWidth : width}
          height={withContainer ? containerHeight : height}
        />
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={{ width, height, borderRadius: BORDER_RADIUS_PRIMARY }}
          // Just in case the URI is valid and image exists, but still fails to load
          onError={attemptToLoadFallbackImage}
          onLoad={handleImageLoaded}
          {...props}
        />
      )}
      {!!network && withNetworkIcon ? (
        <View
          style={[
            styles.networkIconWrapper,
            !withContainer && {
              left: -3,
              top: -3
            }
          ]}
        >
          <NetworkIcon
            id={!onGasTank ? network.id : 'gasTank'}
            size={networkSize}
            style={styles.networkIcon}
          />
        </View>
      ) : null}
    </View>
  )
}

export default React.memo(TokenIcon)
