import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import GasTankIcon from '@common/assets/svg/GasTankIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import usePrivateMode from '@common/hooks/usePrivateMode'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

interface Props {
  totalBalance: string
  onPress: () => any
}

const GasTankBalance = ({ totalBalance, onPress }: Props) => {
  const { t } = useTranslation()
  const { hidePrivateValue } = usePrivateMode()

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.6} onPress={onPress}>
      <View
        style={[
          flexboxStyles.directionRow,
          flexboxStyles.alignCenter,
          spacings.prTy,
          spacings.plMi
        ]}
      >
        <GasTankIcon width={21} height={21} />
        <Text fontSize={10} style={styles.balanceLabel}>
          {t('Balance on All Networks')}
        </Text>
      </View>
      <Text fontSize={32} weight="regular" numberOfLines={1} style={styles.balanceTotal}>
        <Text fontSize={20} weight="regular">
          ${' '}
        </Text>
        {hidePrivateValue(totalBalance)}
      </Text>
    </TouchableOpacity>
  )
}

export default React.memo(GasTankBalance)
