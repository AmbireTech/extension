import React, { useEffect, useState } from 'react'
import { Image, TouchableOpacity, View, ViewStyle } from 'react-native'

import MissingCollectibleIcon from '@common/assets/svg/MissingCollectibleIcon'
import FastImage from '@common/components/FastImage'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import handleCollectibleUri from '@common/modules/dashboard/helpers/handleCollectibleUri'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { checkIfImageExists } from '@common/utils/checkIfImageExists'

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
      const hasLoadedUri = await checkIfImageExists(uri)
      if (hasLoadedUri) {
        const url = await handleCollectibleUri(uri)
        setValidUri(url as string) // the `hasLoadedUri` handles if `uri` is defined
        setIsAssetImageLoading(false)
        return
      }

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
      onError={() => setIsAssetImageLoading(false)}
    />
  ) : (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <MissingCollectibleIcon width={width} height={height} style={style} />
    </View>
  )
}

export default React.memo(CollectibleIcon)
