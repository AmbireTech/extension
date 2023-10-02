import React, { ReactNode } from 'react'
import { TouchableOpacity, View, ViewProps } from 'react-native'

import CheckIcon from '@common/assets/svg/CheckIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

interface Props {
  label?: ReactNode
  onValueChange: (value: boolean) => void
  value: boolean
  children?: any
  style?: ViewProps['style']
  isDisabled?: boolean
}

const Checkbox = ({ label, children, onValueChange, value, style, isDisabled }: Props) => {
  const { theme } = useTheme()
  const onChange = () => {
    !!onValueChange && onValueChange(!value)
  }

  return (
    <View style={[styles.container, style, isDisabled && { opacity: 0.6 }]}>
      <View style={styles.checkboxWrapper}>
        <TouchableOpacity
          style={[
            styles.webCheckbox,
            {
              borderColor: value ? theme.accent1 : theme.primaryBorder
            },
            !!value && { backgroundColor: theme.accent1 }
          ]}
          onPress={onChange}
          activeOpacity={0.6}
          disabled={isDisabled}
        >
          {!!value && <CheckIcon color={theme.accent1} />}
        </TouchableOpacity>
      </View>
      <View style={flexboxStyles.flex1}>
        {label ? (
          <Text shouldScale={false} onPress={onChange} weight="regular" fontSize={12}>
            {label}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  )
}

export default Checkbox
