import { Collectible } from 'ambire-common/src/libs/portfolio/interfaces'
import React, { FC, useEffect, useState } from 'react'
import { Image, Pressable, View } from 'react-native'

import NetworkIcon from '@common/components/NetworkIcon'
import { NetworkIconNameType } from '@common/components/NetworkIcon/NetworkIcon'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import { fetchCaught } from '@common/services/fetch'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  address: string
  name: string
  network: NetworkIconNameType
  collectibles: Collectible[]
}

const handleFetchImage = async (url: string) => {
  const resp = await fetchCaught(url)

  return resp
}

export const handleCollectibleUri = (uri: string) => {
  let imageUri = uri
  if (!imageUri) return ''
  imageUri = uri.startsWith('data:application/json')
    ? imageUri.replace('data:application/json;utf8,', '')
    : imageUri

  if (imageUri.split('/').length === 1) return `https://ipfs.io/ipfs/${imageUri}`
  if (imageUri.split('/')[0] === 'data:image') return imageUri
  if (imageUri.startsWith('ipfs://'))
    return imageUri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
  if (imageUri.split('/')[2].endsWith('mypinata.cloud'))
    return `https://ipfs.io/ipfs/${imageUri.split('/').slice(4).join('/')}`

  return imageUri
}

const Collection: FC<Props> = ({ address, name, network, collectibles }) => {
  const [image, setImage] = useState('')
  const { navigate } = useNavigation()

  useEffect(() => {
    const uri = handleCollectibleUri(collectibles[0].url)

    handleFetchImage(uri).then((resp) => {
      const body = resp.body as any

      if (typeof body !== 'object' || body === null || !('image' in body)) return

      setImage(handleCollectibleUri(body.image))
    })
  }, [collectibles, image])

  return (
    <Pressable
      style={({ hovered }: any) => [
        flexbox.directionRow,
        flexbox.justifySpaceBetween,
        flexbox.alignCenter,
        { borderRadius: 12, padding: SPACING_MI, borderWidth: 1, borderColor: 'transparent' },
        hovered ? { backgroundColor: '#B6B9FF26', borderColor: '#6770B333' } : {}
      ]}
      onPress={() => {
        navigate(ROUTES.collection, {
          state: {
            address,
            name,
            collectibles,
            image
          }
        })
      }}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Image style={{ width: 30, height: 30, borderRadius: 12 }} source={{ uri: image }} />
        <Text weight="regular" style={[spacings.mlTy]} fontSize={14}>
          {name} ({collectibles.length})
        </Text>
      </View>
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Text shouldScale={false} fontSize={12}>
          on
        </Text>
        <NetworkIcon name={network} style={{ width: 25, height: 25 }} />
        <Text style={[spacings.mrMi]} shouldScale={false} fontSize={12}>
          {network}
        </Text>
      </View>
    </Pressable>
  )
}

export default Collection
