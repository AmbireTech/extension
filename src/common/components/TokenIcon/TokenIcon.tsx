import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ImageProps, View, ViewStyle } from 'react-native'

import { networks as predefinedNetworks } from '@ambire-common/consts/networks'
import MissingTokenIcon from '@common/assets/svg/MissingTokenIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { checkIfImageExists } from '@common/utils/checkIfImageExists'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

import SkeletonLoader from '../SkeletonLoader'
import { SkeletonLoaderProps } from '../SkeletonLoader/types'
import getStyles from './styles'

interface Props extends Partial<ImageProps> {
  /* supports network id or chain id */
  networkId?: string | number
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
  networkId: networkIdOrChainId,
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
  const { networks: controllerNetworks } = useNetworksControllerState()
  const [uriStatus, setUriStatus] = useState<UriStatus>(UriStatus.UNKNOWN)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  // In the Benzin context, the networks controller is not defined, fallback to predefined networks
  const networks = controllerNetworks || predefinedNetworks

  const network = useMemo(
    () =>
      networks.find((n) => {
        const isNetworkId = typeof networkIdOrChainId === 'string'
        return isNetworkId ? n.id === networkIdOrChainId : Number(n.chainId) === networkIdOrChainId
      }),
    [networkIdOrChainId, networks]
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

  const shouldDisplayNetworkIcon = withNetworkIcon && !!network

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
      {shouldDisplayNetworkIcon && (
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
      )}
    </View>
  )
}

export default React.memo(TokenIcon)
