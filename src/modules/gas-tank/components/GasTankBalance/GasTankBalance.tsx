import React from 'react'
import { View } from 'react-native'

import { useTranslation } from '@config/localization'
import Text from '@modules/common/components/Text'
import textStyles from '@modules/common/styles/utils/text'

import styles from './styles'

interface Props {
  balance: string
}

const GasTankBalance = ({ balance }: Props) => {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Text fontSize={10}>{t('Gas Tank Balance')}</Text>
      <Text fontSize={32} weight="regular" numberOfLines={1}>
        <Text fontSize={20} weight="regular" style={textStyles.highlightSecondary}>
          ${' '}
        </Text>
        {balance}
      </Text>
    </View>
  )
}

export default React.memo(GasTankBalance)
