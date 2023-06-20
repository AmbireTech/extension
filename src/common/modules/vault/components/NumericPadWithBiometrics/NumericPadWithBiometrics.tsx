import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import CodeInput from '@common/components/CodeInput'
import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import text from '@common/styles/utils/text'
import { Ionicons } from '@expo/vector-icons'

const NumericPadWithBiometrics = ({ setValue, isDisabled, value, retryBiometrics }) => {
  const appendDigit = (digit) => {
    setValue('password', value + digit, {
      shouldValidate: true
    })
  }

  return (
    <View style={[{ alignItems: 'center' }]}>
      <CodeInput
        // TODO: Pass errors
        // onFulfill={(nextValue) => {
        //   // onChange(nextValue)
        //   handleSubmit((data) => {
        //     unlockVault(data, setError)
        //   })()
        // }}
        setValue={(v) => setValue('password', v)}
        value={value}
      />
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3].map((digit) => (
          <TouchableOpacity
            disabled={isDisabled}
            key={digit}
            onPress={() => appendDigit(digit)}
            style={[
              spacings.mhTy,
              spacings.mvTy,
              spacings.pvTy,
              {
                backgroundColor: colors.chetwode_50,
                width: '30%',
                maxWidth: 100,
                borderRadius: BORDER_RADIUS_PRIMARY
              }
            ]}
          >
            <Text weight="semiBold" fontSize={30} style={text.center}>
              {digit.toString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row' }}>
        {[4, 5, 6].map((digit) => (
          <TouchableOpacity
            disabled={isDisabled}
            key={digit}
            onPress={() => appendDigit(digit)}
            style={[
              spacings.mhTy,
              spacings.mvTy,
              spacings.pvTy,
              {
                backgroundColor: colors.chetwode_50,
                width: '30%',
                maxWidth: 100,
                borderRadius: BORDER_RADIUS_PRIMARY
              }
            ]}
          >
            <Text weight="semiBold" fontSize={30} style={text.center}>
              {digit.toString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row' }}>
        {[7, 8, 9].map((digit) => (
          <TouchableOpacity
            disabled={isDisabled}
            key={digit}
            onPress={() => appendDigit(digit)}
            style={[
              spacings.mhTy,
              spacings.mvTy,
              spacings.pvTy,
              {
                backgroundColor: colors.chetwode_50,
                width: '30%',
                maxWidth: 100,
                borderRadius: BORDER_RADIUS_PRIMARY
              }
            ]}
          >
            <Text weight="semiBold" fontSize={30} style={text.center}>
              {digit.toString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 0 button */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          width: '100%'
        }}
      >
        {[0].map((digit) => (
          <TouchableOpacity
            disabled={isDisabled}
            key={digit}
            onPress={() => appendDigit(digit)}
            style={[
              spacings.mhTy,
              spacings.mvTy,
              spacings.pvTy,
              {
                backgroundColor: colors.chetwode_50,
                width: '30%',
                maxWidth: 100,
                borderRadius: BORDER_RADIUS_PRIMARY
              }
            ]}
          >
            <Text weight="semiBold" fontSize={30} style={text.center}>
              {digit.toString()}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          disabled={isDisabled}
          onPress={retryBiometrics}
          style={[
            spacings.mhTy,
            spacings.mvTy,
            spacings.pvTy,
            {
              // backgroundColor: colors.chetwode_50,
              width: '30%',
              maxWidth: 100,
              borderRadius: BORDER_RADIUS_PRIMARY
            }
          ]}
        >
          <Text weight="semiBold" fontSize={30} style={text.center}>
            <Ionicons name="finger-print-sharp" size={38} color={colors.titan} />
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default NumericPadWithBiometrics
