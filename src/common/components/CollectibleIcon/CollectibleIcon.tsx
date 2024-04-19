import React, { useEffect, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import MissingCollectibleIcon from '@common/assets/svg/MissingCollectibleIcon'
import FastImage from '@common/components/FastImage'
import Spinner from '@common/components/Spinner'
import handleCollectibleUri from '@common/modules/dashboard/helpers/handleCollectibleUri'

type Props = {
  uri: string
  width?: number
  height?: number
  style?: ViewStyle
}

const CollectibleIcon = ({ uri, width, height, style }: Props) => {
  const [isAssetImageLoading, setIsAssetImageLoading] = useState(true)
  const [validUri, setValidUri] = useState('')

  useEffect(() => {
    ;(async () => {
      const url = await handleCollectibleUri(uri)
      setValidUri(url as string)
      setIsAssetImageLoading(false)
      
    })()
  }, [uri])

  return isAssetImageLoading ? (
    <Spinner />
  ) : validUri ? (
    <FastImage
      style={{ width: width || '100%', aspectRatio: 1, height, ...style }}
      source={{ uri: validUri }}
      onLoad={() => setIsAssetImageLoading(false)}
      onError={() => { setIsAssetImageLoading(false), setValidUri('') }}
    />
  ) : (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <MissingCollectibleIcon width={width} height={height} style={style} />
    </View>
  )
}

export default React.memo(CollectibleIcon)
