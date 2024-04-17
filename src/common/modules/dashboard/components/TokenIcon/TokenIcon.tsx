import React, { useEffect, useMemo, useState } from 'react'
import { Image, ImageProps, View } from 'react-native'

import { networks as predefinedNetworks } from '@ambire-common/consts/networks'
import MissingTokenIcon from '@common/assets/svg/MissingTokenIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Spinner from '@common/components/Spinner'
import useTheme from '@common/hooks/useTheme'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { fetchImageFromCena } from '@common/utils/checkIfImageExists'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'

import getStyles from './styles'

interface Props extends Partial<ImageProps> {
  networkId?: string
  address?: string
  withContainer?: boolean
  containerWidth?: number
  containerHeight?: number
  width?: number
  height?: number
  onGasTank?: boolean
  networkSize?: number
  uri?: string
}

const TokenIcon: React.FC<Props> = ({
  networkId = '',
  address = '',
  withContainer = false,
  containerWidth = 35,
  containerHeight = 35,
  width = 20,
  height = 20,
  onGasTank = false,
  networkSize = 14,
  ...props
}) => {
  // try to retrieve the image from the cache
  const key = `${networkId}:${address}`
  const uriValueFromCena = localStorage.getItem(key) ?? ''
  const uriValue =
    uriValueFromCena !== '' && uriValueFromCena !== 'not-found' ? uriValueFromCena : ''

  const { theme, styles } = useTheme(getStyles)
  const [isLoading, setIsLoading] = useState(uriValueFromCena === '')
  const [validUri, setValidUri] = useState(uriValue)
  const { networks } = useSettingsControllerState()

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      if (validUri !== '') return

      // if we're in the extension, we have settings networks => we load from there
      // if benzina, we don't => we load from predefined
      // this will affect custom networks in benzina but the external benzin
      // doesn't work with custom networks at the moment
      const network = networks
        ? networks.find((net) => net.id === networkId)
        : predefinedNetworks.find((net) => net.id === networkId)
      if (network) {
        const cenaUrl = `https://cena.ambire.com/iconProxy/${network.platformId}/${address}`
        const cenaImg = await fetchImageFromCena(cenaUrl)
        if (cenaImg) {
          localStorage.setItem(key, cenaImg)
          setValidUri(cenaImg)
          setIsLoading(false)
          return
        }
      }

      localStorage.setItem(key, 'not-found')
      setIsLoading(false)
    })()
  }, [address, networkId, networks, key, validUri])

  const containerStyle = useMemo(
    () =>
      withContainer && [
        {
          width: containerWidth,
          height: containerHeight,
          backgroundColor: theme.secondaryBackground,
          ...common.borderRadiusPrimary,
          ...flexbox.alignCenter,
          ...flexbox.justifyCenter
        }
      ],
    [containerHeight, containerWidth, withContainer, theme.secondaryBackground]
  )

  return (
    <View style={containerStyle}>
      {!!isLoading && <Spinner style={{ width: 24, height: 24 }} />}
      {!!validUri && !isLoading && (
        <Image
          source={{ uri: validUri }}
          style={{ width, height, borderRadius: BORDER_RADIUS_PRIMARY }}
          {...props}
        />
      )}
      {!validUri && !isLoading && (
        <MissingTokenIcon
          withRect={withContainer}
          // A bit larger when they don't have a container,
          // because the SVG sizings are made with rectangle in mind
          width={withContainer ? containerWidth : width * 1.3}
          height={withContainer ? containerHeight : height * 1.3}
        />
      )}

      <View
        style={[
          styles.networkIconWrapper,
          !withContainer && {
            left: -3,
            top: -3
          }
        ]}
      >
        {networkId && (
          <NetworkIcon
            id={!onGasTank ? networkId : 'gasTank'}
            size={networkSize}
            style={styles.networkIcon}
          />
        )}
      </View>
    </View>
  )
}

export default React.memo(TokenIcon)
