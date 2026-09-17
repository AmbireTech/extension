import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ImageProps, View, ViewStyle } from 'react-native'
import { SvgUri } from 'react-native-svg'

import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import type { FeatureFlagsController } from '@ambire-common/controllers/featureFlags/featureFlags'
import MissingTokenIcon from '@common/assets/svg/MissingTokenIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import { isBenzin, isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { checkIfImageExists } from '@common/utils/checkIfImageExists'
import { getHardcodedCitreaIcons } from '@common/utils/getHardcodedCitreaIcons'

import SkeletonLoader from '../SkeletonLoader'
import { SkeletonLoaderProps } from '../SkeletonLoader/types'
import getStyles from './styles'

interface Props extends Partial<ImageProps> {
  /* supports network id or chain id */
  chainId?: bigint
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
  networkWrapperStyle?: ViewStyle
  skeletonAppearance?: SkeletonLoaderProps['appearance']
}

enum UriStatus {
  UNKNOWN = 'UNKNOWN',
  IMAGE_MISSING = 'IMAGE_MISSING',
  IMAGE_EXISTS = 'IMAGE_EXISTS'
}

const isNeverCancelled = () => false

const selectTokenAndDefiAutoDiscovery = (state: FeatureFlagsController) =>
  state.flags?.tokenAndDefiAutoDiscovery ?? false

const TokenIcon: React.FC<Props> = ({
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
  networkWrapperStyle,
  skeletonAppearance = 'primaryBackground',
  ...props
}) => {
  const { styles } = useTheme(getStyles)
  const [uriStatus, setUriStatus] = useState<UriStatus>(UriStatus.UNKNOWN)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const { state: ctrlNetworks } = useController('NetworksController', (state) => state.networks)
  const { state: tokenAndDefiAutoDiscovery } = useController(
    'FeatureFlagsController',
    selectTokenAndDefiAutoDiscovery
  )
  const { benzinNetworks } = useBenzinNetworksContext()
  // Component used across Benzin and Extension, make sure to always set networks
  const networks = ctrlNetworks ?? benzinNetworks
  // Benzin has no wallet privacy controls, so preserve its existing icon behavior.
  const shouldLoadTokenIcon = isBenzin || tokenAndDefiAutoDiscovery

  const network = useMemo(
    () => networks.find((n) => String(n.chainId) === String(chainId)),
    [chainId, networks]
  )

  const handleImageLoaded = useCallback(() => setUriStatus(UriStatus.IMAGE_EXISTS), [])
  const attemptToLoadFallbackImage = useCallback(
    async (isCancelled = isNeverCancelled) => {
      if (!shouldLoadTokenIcon || isCancelled()) return

      if (fallbackUri) {
        const doesFallbackUriImageExists = await checkIfImageExists(fallbackUri)
        if (isCancelled()) return

        if (doesFallbackUriImageExists) {
          setImageUrl(fallbackUri)
          setUriStatus(UriStatus.IMAGE_EXISTS)
          return
        }
      }

      // hardcoded icons for citrea
      if (network?.chainId === 4114n) {
        const tokenUrl = getHardcodedCitreaIcons(address.toLowerCase())
        const imageExists = tokenUrl && (await checkIfImageExists(tokenUrl))
        if (isCancelled()) return

        if (imageExists) {
          setImageUrl(tokenUrl)
          setUriStatus(UriStatus.IMAGE_EXISTS)
          return
        }
      }

      setUriStatus(UriStatus.IMAGE_MISSING)
      setImageUrl(undefined)
    },
    [fallbackUri, address, network?.chainId, shouldLoadTokenIcon]
  )
  const handleImageError = useCallback(
    () => attemptToLoadFallbackImage(),
    [attemptToLoadFallbackImage]
  )

  useEffect(() => {
    if (!shouldLoadTokenIcon) {
      return
    }

    let isCancelled = false

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

      await attemptToLoadFallbackImage(() => isCancelled)
    })()

    return () => {
      isCancelled = true
    }
  }, [
    address,
    network?.platformId,
    fallbackUri,
    attemptToLoadFallbackImage,
    network,
    shouldLoadTokenIcon
  ])

  const memoizedContainerStyle = useMemo(
    () => [
      {
        width: withContainer ? containerWidth : width,
        height: withContainer ? containerHeight : height
      },
      withContainer && styles.withContainerStyle,
      containerStyle
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

  const shouldDisplayNetworkIcon = withNetworkIcon && !!network && !onGasTank
  const displayedUriStatus = shouldLoadTokenIcon ? uriStatus : UriStatus.IMAGE_MISSING

  return (
    <View style={memoizedContainerStyle}>
      {displayedUriStatus === UriStatus.UNKNOWN ? (
        <SkeletonLoader
          width={width}
          height={height}
          style={styles.loader}
          appearance={skeletonAppearance}
        />
      ) : displayedUriStatus === UriStatus.IMAGE_MISSING ? (
        <MissingTokenIcon
          width={withContainer ? containerWidth : width}
          height={withContainer ? containerHeight : height}
        />
      ) : isMobile && imageUrl?.toLowerCase().endsWith('.svg') ? (
        <View style={{ borderRadius: BORDER_RADIUS_PRIMARY, overflow: 'hidden' }}>
          <SvgUri
            width={width}
            height={height}
            uri={imageUrl}
            onError={handleImageError}
            onLoad={handleImageLoaded}
          />
        </View>
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={{ width, height, borderRadius: BORDER_RADIUS_PRIMARY }}
          // Just in case the URI is valid and image exists, but still fails to load
          onError={handleImageError}
          onLoad={handleImageLoaded}
          {...props}
        />
      )}
      {shouldDisplayNetworkIcon && (
        <View
          style={[
            styles.networkIconWrapper,
            withContainer ? { left: -1, top: -1 } : { left: -4, top: -4 },
            networkWrapperStyle
          ]}
        >
          <NetworkIcon
            id={!onGasTank ? network.chainId.toString() : 'gasTank'}
            size={networkSize}
            style={styles.networkIcon}
            benzinNetwork={network}
          />
        </View>
      )}
    </View>
  )
}

export default React.memo(TokenIcon)
