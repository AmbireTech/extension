import React, { useEffect, useMemo, useState } from 'react'
import { Image, ImageProps, View } from 'react-native'

import MissingTokenIcon from '@assets/svg/MissingTokenIcon'
import { getTokenIcon } from '@modules/common/services/icons'

import Spinner from '../Spinner'
import styles from './styles'

interface Props extends Partial<ImageProps> {
  uri?: string
  networkId?: string
  address?: string
  withContainer?: boolean
  containerWidth?: number
  containerHeight?: number
  width?: number
  height?: number
}

/**
 * Check if an image exists or not using the ES6 Fetch API
 * {@link https://stackoverflow.com/a/56196999/1333836}
 */
const checkIfImageExists = (uri?: string) => {
  if (!uri) {
    return Promise.resolve(false)
  }

  return fetch(uri, { method: 'HEAD' })
    .then((res) => {
      if (res.ok) {
        return Promise.resolve(true)
      }

      return Promise.resolve(false)
    })
    .catch(() => Promise.resolve(false))
}

const TokenIcon: React.FC<Props> = ({
  uri,
  networkId = '',
  address = '',
  withContainer = false,
  containerWidth = 34,
  containerHeight = 34,
  width = 22,
  height = 22,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [validUri, setValidUri] = useState('')

  useEffect(() => {
    ;(async () => {
      if (uri) {
        const hasLoadedTheUriProp = await checkIfImageExists(uri)
        if (hasLoadedTheUriProp) {
          setValidUri(uri)
          setIsLoading(false)
          return
        }
      }

      const alternativeUri = getTokenIcon(networkId, address)
      const hasLoadedTheFallbackUri = await checkIfImageExists(alternativeUri)
      if (hasLoadedTheFallbackUri) {
        setValidUri(alternativeUri)
        setIsLoading(false)
        return
      }

      setIsLoading(false)
    })()
  }, [address, networkId, uri])

  const containerStyle = useMemo(
    () => withContainer && [styles.container, { width: containerWidth, height: containerHeight }],
    [containerHeight, containerWidth, withContainer]
  )

  if (isLoading) {
    return (
      <View style={containerStyle}>
        <Spinner />
      </View>
    )
  }

  return validUri ? (
    <View style={containerStyle}>
      <Image
        source={{ uri: validUri }}
        style={{ width, height, borderRadius: width / 2 }}
        {...props}
      />
    </View>
  ) : (
    <MissingTokenIcon
      withRect={withContainer}
      // A bit larger when they don't have a container,
      // because the SVG sizings are made with rectangle in mind
      width={withContainer ? containerWidth : width * 1.3}
      height={withContainer ? containerHeight : height * 1.3}
    />
  )
}

export default TokenIcon
