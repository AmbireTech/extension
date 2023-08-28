import { Collectible as CollectibleType } from 'ambire-common/src/libs/portfolio/interfaces'
import React, { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Pressable, View, ViewStyle } from 'react-native'

import SendIcon from '@common/assets/svg/SendIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation/useNavigation.web'
import useNft from '@common/hooks/useNft'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import ImageIcon from '@web/assets/svg/ImageIcon'
import { getUiType } from '@web/utils/uiType'

import styles from './styles'

type Props = CollectibleType & {
  collectionData: {
    name: string
    image: string
    address: string
    networkId: string
  }
}

const isTab = getUiType().isTab

const SIZE = isTab ? 250 : 150

const containerStyle: ViewStyle[] = [
  {
    position: 'relative',
    ...spacings.mtLg,
    width: SIZE,
    height: SIZE,
    borderRadius: 12,
    overflow: 'hidden'
  },
  isTab ? spacings.mrXl : {}
]

const Collectible: FC<Props> = ({ id, collectionData }) => {
  const [imageFailed, setImageFailed] = useState(false)
  const { t } = useTranslation()
  const { data, error, isLoading } = useNft({
    id,
    address: collectionData.address,
    networkId: collectionData.networkId
  })
  const { navigate } = useNavigation()

  // Works like a skeleton loader while the collectible is being fetched.
  if (isLoading)
    return <View style={[...containerStyle, { backgroundColor: colors.martinique_35 }]} />

  if (!data && !error) return null

  return (
    <Pressable
      style={containerStyle}
      onPress={() => {
        navigate(
          `${ROUTES.collectible}?id=${String(id)}&address=${collectionData.address}&networkId=${
            collectionData.networkId
          }`
        )
      }}
    >
      {({ hovered }: any) => (
        <>
          {!error && data?.image && !imageFailed && (
            <Image
              onError={() => setImageFailed(true)}
              source={{ uri: data.image }}
              style={styles.image}
            />
          )}
          {(error || imageFailed || !data?.image) && <ImageIcon width={SIZE} height={SIZE} />}
          {hovered ? (
            <View style={[styles.hoveredContent, isTab ? spacings.ptMd : spacings.ptTy]}>
              <View>
                <Text
                  style={[styles.text, isTab ? spacings.mbTy : {}]}
                  color={colors.martinique}
                  fontSize={isTab ? 24 : 20}
                  weight="medium"
                >
                  {data?.name ? data.name.slice(0, 10) : 'Unknown name'}
                </Text>
                {/* 
                We won't show the description for now
                <Text
                  style={styles.text}
                  color={colors.martinique}
                  weight="regular"
                  fontSize={isTab ? 16 : 12}
                >
                  {data.description.slice(0, isTab ? 50 : 30)}
                  {data.description.length > (isTab ? 50 : 30) ? '...' : ''}
                </Text> */}
              </View>
              <View>
                <Text
                  fontSize={isTab ? 20 : 16}
                  weight="regular"
                  style={[styles.text, isTab ? spacings.mbSm : spacings.mbTy]}
                  color={colors.violet}
                >
                  $0.00
                </Text>
                <Button
                  disabled
                  disabledStyle={{}}
                  type="outline"
                  size="small"
                  accentColor={colors.violet}
                  style={styles.button}
                  text={t('Send')}
                  hasBottomSpacing={false}
                >
                  <SendIcon width={20} height={20} color={colors.violet} />
                </Button>
              </View>
            </View>
          ) : null}
          {hovered ? <View style={styles.hoveredBackground} /> : null}
        </>
      )}
    </Pressable>
  )
}

export default Collectible
