import { formatUnits } from 'ethers'
import React from 'react'
import { View } from 'react-native'

import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme/useTheme'
import { SPACING_SM, SPACING_TY } from '@common/styles/spacings'

import getStyles from './styles'

interface Props {
  call: IrCall
  size: 'sm' | 'md' | 'lg'
  sizeMultiplier: Record<'sm' | 'md' | 'lg', number>
  styles: Record<string, any>
}

const ExpandedContent = ({ call, size, sizeMultiplier }: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)

  return (
    <View
      style={{
        paddingHorizontal: SPACING_SM * sizeMultiplier[size],
        paddingVertical: SPACING_TY * sizeMultiplier[size]
      }}
    >
      {call.to && (
        <Text selectable fontSize={12} style={styles.bodyText}>
          <Text fontSize={12} style={styles.bodyText}>
            {t('Interacting with (to): ')}
          </Text>
          {call.to}
        </Text>
      )}
      <Text selectable fontSize={12} style={styles.bodyText}>
        <Text fontSize={12} style={styles.bodyText}>
          {t('Value to be sent (value): ')}
        </Text>
        {formatUnits(call.value || '0x0', 18)}
      </Text>

      <Text selectable fontSize={12} style={styles.bodyText}>
        <Text fontSize={12} style={styles.bodyText}>
          {t('Data: ')}
        </Text>
        <Text fontSize={12} style={styles.bodyText}>
          {call.data}
        </Text>
      </Text>
    </View>
  )
}

export default ExpandedContent
