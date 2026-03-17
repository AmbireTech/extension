import React, { ReactNode } from 'react'
import { ColorValue, TouchableOpacity, View, ViewProps } from 'react-native'

import CheckIcon2 from '@common/assets/svg/CheckIcon2'
import Text, { Props as TextProps } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

interface Props {
  label?: ReactNode
  labelProps?: TextProps
  onValueChange: (value: boolean) => void
  value: boolean
  children?: any
  style?: ViewProps['style']
  uncheckedBorderColor?: ColorValue
  checkedColor?: ColorValue
  isDisabled?: boolean
  testID?: string
}

const Checkbox = ({
  label,
  labelProps,
  children,
  onValueChange,
  value,
  style,
  uncheckedBorderColor,
  checkedColor,
  isDisabled,
  testID = 'checkbox'
}: Props) => {
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
              borderColor: value
                ? checkedColor || theme.success400
                : uncheckedBorderColor || theme.neutral600
            },
            !!value && { backgroundColor: checkedColor || theme.success400 }
          ]}
          testID={testID}
          onPress={onChange}
          activeOpacity={0.6}
          disabled={isDisabled}
        >
          {!!value && (
            <CheckIcon2 color={checkedColor || theme.success400} checkColor={theme.neutral100} />
          )}
        </TouchableOpacity>
      </View>
      <View style={flexboxStyles.flex1}>
        {label ? (
          <Text
            shouldScale={false}
            onPress={onChange}
            appearance="secondaryText"
            fontSize={12}
            {...labelProps}
          >
            {label}
          </Text>
        ) : (
          children
        )}
      </View>
    </View>
  )
}

export default React.memo(Checkbox)
