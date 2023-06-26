import React from 'react'
import { UseFormSetValue } from 'react-hook-form'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import CodeInput from '@common/components/CodeInput'
import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import { Ionicons } from '@expo/vector-icons'

import NumericButton from './NumericButton'

interface Props {
  value: string
  setValue: UseFormSetValue<{
    password: string
  }>
  isDisabled: boolean
  retryBiometrics: () => Promise<void>
  error?: string
}

const NumericPadWithBiometrics: React.FC<Props> = ({
  setValue,
  isDisabled,
  value,
  retryBiometrics,
  error
}) => {
  const appendDigit = (digit: number) => {
    setValue('password', value + digit, {
      shouldValidate: true
    })
  }

  return (
    <View style={[{ alignItems: 'center' }]}>
      <CodeInput setValue={(v) => setValue('password', v)} value={value} />
      <Text
        fontSize={14}
        weight="regular"
        appearance="danger"
        style={{ position: 'absolute', top: 12 }}
      >
        {error}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3].map((digit) => (
          <NumericButton
            isDisabled={isDisabled}
            key={digit}
            onPress={() => appendDigit(digit)}
            digit={digit}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row' }}>
        {[4, 5, 6].map((digit) => (
          <NumericButton
            isDisabled={isDisabled}
            key={digit}
            onPress={() => appendDigit(digit)}
            digit={digit}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row' }}>
        {[7, 8, 9].map((digit) => (
          <NumericButton
            isDisabled={isDisabled}
            key={digit}
            onPress={() => appendDigit(digit)}
            digit={digit}
          />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          width: '100%'
        }}
      >
        <View style={{ width: '33.33%' }} />

        {[0].map((digit) => (
          <NumericButton
            isDisabled={isDisabled}
            key={digit}
            onPress={() => appendDigit(digit)}
            digit={digit}
          />
        ))}

        <View style={{ width: '33.33%' }}>
          <TouchableOpacity
            disabled={isDisabled}
            onPress={retryBiometrics}
            style={[spacings.mhTy, spacings.mvTy, spacings.pvTy]}
          >
            <Ionicons
              name="finger-print-sharp"
              size={25}
              color={colors.titan}
              style={{ alignSelf: 'center' }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default NumericPadWithBiometrics
