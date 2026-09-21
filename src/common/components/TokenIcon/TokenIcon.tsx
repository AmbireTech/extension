import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Image, ImageProps, View, ViewStyle } from 'react-native'
import { SvgUri } from 'react-native-svg'

import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import MissingTokenIcon from '@common/assets/svg/MissingTokenIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { checkIfImageExists } from '@common/utils/checkIfImageExists'
import { getHardcodedCitreaIcons } from '@common/utils/getHardcodedCitreaIcons'

import SkeletonLoader from '../SkeletonLoader'
import { SkeletonLoaderProps } from '../SkeletonLoader/types'
import getStyles from './styles'

import type { NetworksController } from '@ambire-common/controllers/networks/networks'

const selectNetworks = (state: NetworksController) => state.networks

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

/**
 * The icon to show for a proxy url, with no lookup: the url almost always exists, and
 * `onError` handles it when it does not. `target` records which url this was resolved for,
 * so an answer that arrives after the token changed can be recognised and dropped.
 */
const resolveAmbireIcon = (ambireIconUri?: string) => ({
  target: ambireIconUri,
  status: ambireIconUri ? UriStatus.IMAGE_EXISTS : UriStatus.UNKNOWN,
  uri: ambireIconUri
})

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
  const { state: ctrlNetworks } = useController('NetworksController', selectNetworks)
  const { benzinNetworks } = useBenzinNetworksContext()
  // Component used across Benzin and Extension, make sure to always set networks
  const networks = ctrlNetworks ?? benzinNetworks

  const network = useMemo(
    () => networks.find((n) => String(n.chainId) === String(chainId)),
    [chainId, networks]
  )

  const platformId = network?.platformId
  const chainIdOfNetwork = network?.chainId

  const ambireIconUri = useMemo(
    () =>
      platformId && address
        ? `https://cena.ambire.com/iconProxy/${platformId}/${address}`
        : undefined,
    [platformId, address]
  )

  const [resolved, setResolved] = useState(() => resolveAmbireIcon(ambireIconUri))

  // Adjusted while rendering rather than written from an effect, which had every icon of
  // every token row and every select option paint a skeleton and then render again for a
  // url its own props already decide.
  if (resolved.target !== ambireIconUri) setResolved(resolveAmbireIcon(ambireIconUri))

  const { status: uriStatus, uri: imageUrl } = resolved

  const handleImageLoaded = useCallback(
    () =>
      setResolved((prev) =>
        prev.status === UriStatus.IMAGE_EXISTS ? prev : { ...prev, status: UriStatus.IMAGE_EXISTS }
      ),
    []
  )

  const attemptToLoadFallbackImage = useCallback(async () => {
    // Kept only while the icon still shows the token this ran for: the lookups below are
    // network calls that outlive a re-used icon, and a late answer would otherwise put the
    // previous token's image on it.
    const apply = (status: UriStatus, uri?: string) =>
      setResolved((prev) =>
        prev.target === ambireIconUri ? { target: ambireIconUri, status, uri } : prev
      )

    if (fallbackUri) {
      const doesFallbackUriImageExists = await checkIfImageExists(fallbackUri)
      if (doesFallbackUriImageExists) {
        apply(UriStatus.IMAGE_EXISTS, fallbackUri)
        return
      }
    }

    // hardcoded icons for citrea
    if (chainIdOfNetwork === 4114n) {
      const tokenUrl = getHardcodedCitreaIcons(address.toLowerCase())
      const imageExists = tokenUrl && (await checkIfImageExists(tokenUrl))
      if (imageExists) {
        apply(UriStatus.IMAGE_EXISTS, tokenUrl)
        return
      }
    }

    apply(UriStatus.IMAGE_MISSING, undefined)
  }, [ambireIconUri, fallbackUri, address, chainIdOfNetwork])

  // Only the icons the proxy url leaves unsettled need looking up. Read off the network's
  // fields rather than the network itself, so a networks update - which hands out a new
  // object every time - does not re-run these network calls per icon.
  useEffect(() => {
    if (ambireIconUri) return

    void attemptToLoadFallbackImage()
  }, [ambireIconUri, attemptToLoadFallbackImage])

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
          width={withContainer ? containerWidth : width}
          height={withContainer ? containerHeight : height}
        />
      ) : isMobile && imageUrl?.toLowerCase().endsWith('.svg') ? (
        <View style={{ borderRadius: BORDER_RADIUS_PRIMARY, overflow: 'hidden' }}>
          <SvgUri
            width={width}
            height={height}
            uri={imageUrl}
            onError={attemptToLoadFallbackImage}
            onLoad={handleImageLoaded}
          />
        </View>
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
