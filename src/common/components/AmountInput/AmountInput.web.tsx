import React from 'react'
import { View, ViewStyle } from 'react-native'

import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { AmountInputProps } from './AmountInput'

const AmountInput = ({
  type,
  value,
  onChangeText,
  disabled,
  inputTestId,
  fontSize = 24,
  inputWrapperStyle,
  backgroundColor,
  ...rest
}: AmountInputProps) => {
  const { theme } = useTheme()

  return (
    <NumberInput
      value={value}
      onChangeText={onChangeText}
      placeholder="0"
      borderless
      inputWrapperStyle={
        inputWrapperStyle
          ? [{ backgroundColor: backgroundColor || 'transparent' }, inputWrapperStyle]
          : { backgroundColor: backgroundColor || 'transparent' }
      }
      nativeInputStyle={{
        fontFamily: FONT_FAMILIES.MEDIUM,
        fontSize: fontSize,
        textAlign: 'right',
        color: theme.primaryText
      }}
      disabled={disabled}
      containerStyle={[spacings.mb0 as ViewStyle, flexbox.flex1, { overflow: 'hidden' }]}
      inputStyle={spacings.ph0}
      testID={inputTestId}
      childrenBelowInput={
        type === 'fiat' && (
          <View
            style={{
              position: 'absolute',
              right: 0,
              top: -1,
              zIndex: -1,
              width: '100%',
              height: '100%',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            <Text
              fontSize={fontSize}
              weight="medium"
              style={{ zIndex: 3 }}
              appearance="secondaryText"
            >
              $
              <Text
                fontSize={fontSize}
                weight="medium"
                style={{ opacity: 0 }}
                appearance="secondaryText"
              >
                {value || '0'}
              </Text>
            </Text>
          </View>
        )
      }
      {...rest}
    />
  )
}

export default React.memo(AmountInput)
