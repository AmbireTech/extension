import React, { useCallback } from 'react'
import { UseFormSetValue } from 'react-hook-form'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import InputPin from '@common/components/InputPin'
import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Ionicons } from '@expo/vector-icons'

import NumericButton from './NumericButton'
import styles from './style'

interface Props {
  value: string
  setValue: UseFormSetValue<{
    password: string
  }>
  isDisabled: boolean
  retryBiometrics: () => Promise<void>
  biometricsEnabled: boolean
  error?: string
}

const NumericPadWithBiometrics: React.FC<Props> = ({
  setValue,
  isDisabled,
  value,
  retryBiometrics,
  biometricsEnabled,
  error
}) => {
  const appendDigit = useCallback(
    (digit: number) => {
      setValue('password', value + digit, {
        shouldValidate: true
      })
    },
    [setValue, value]
  )

  const handleInputPinSetValue = useCallback((v: string) => setValue('password', v), [setValue])

  const renderDigit = useCallback(
    (digit: number) => (
      <NumericButton isDisabled={isDisabled} key={digit} onPress={appendDigit} digit={digit} />
    ),
    [isDisabled, appendDigit]
  )

  return (
    <View style={flexbox.alignCenter}>
      <InputPin setValue={handleInputPinSetValue} value={value} />
      <Text fontSize={14} weight="regular" appearance="danger" style={styles.errorMessage}>
        {error}
      </Text>

      <View style={styles.numericContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(renderDigit)}

        {/* So it takes up the remaining space (and aligns the row elements) */}
        <View style={styles.numericButtonContainer} />

        {[0].map(renderDigit)}

        <View style={styles.numericButtonContainer}>
          {biometricsEnabled && (
            <TouchableOpacity
              disabled={isDisabled}
              onPress={retryBiometrics}
              style={[spacings.mhTy, spacings.mvTy, spacings.pvTy]}
            >
              <Ionicons
                name="finger-print-sharp"
                size={25}
                color={colors.titan}
                style={flexbox.alignSelfCenter}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

export default React.memo(NumericPadWithBiometrics)
