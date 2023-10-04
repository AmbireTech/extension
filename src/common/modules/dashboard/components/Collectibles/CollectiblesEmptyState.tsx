import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

interface Props {
  isPrivateMode: boolean
  collectiblesLength: number
}

const CollectiblesEmptyState = ({ isPrivateMode, collectiblesLength }: Props) => {
  const { t } = useTranslation()
  return (
    <View
      style={[
        styles.itemsContainer,
        flexboxStyles.directionRow,
        flexboxStyles.alignCenter,
        spacings.mb
      ]}
    >
      <View style={[spacings.mhTy, flexboxStyles.flex1, flexboxStyles.alignCenter]}>
        <Text style={[spacings.phTy, textStyles.center]} fontSize={14}>
          {!!isPrivateMode && !!collectiblesLength
            ? t("You can't see collectibles in private mode")
            : t("You don't have any collectibles (NFTs) yet")}
        </Text>
      </View>
      <View style={[styles.emptyStateItem]}>
        <Text fontSize={24} weight="regular">
          ?
        </Text>
      </View>
    </View>
  )
}

export default CollectiblesEmptyState
