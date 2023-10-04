import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'

import styles from './styles'

type Props = {
  name: string
  onSelect: () => void
}

const HardwareWalletSelectorItem = ({ name, onSelect }: Props) => {
  const { t } = useTranslation()

  return (
    <View style={styles.itemContainer}>
      <Text>{t('Login with {{name}}', { name })}</Text>
      <Button text={name} onPress={onSelect} />
    </View>
  )
}

export default HardwareWalletSelectorItem
