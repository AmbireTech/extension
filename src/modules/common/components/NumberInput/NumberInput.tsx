import React from 'react'

import Input from '../Input'
import { InputProps } from '../Input/Input'

interface Props extends InputProps {
  buttonText?: string
  onButtonPress?: () => any
  precision?: any
}

const NumberInput = ({ onChangeText, precision, ...rest }: Props) => {
  const onInputValue = (value: string) => {
    if (!onChangeText) return
    if (!value) return onChangeText('')

    const afterDecimals = value?.split('.')[1]
    if (afterDecimals && afterDecimals.length > precision) return

    const isIntOrFloat = /^[0-9]+\.{0,1}[0-9]*$/g.test(value)
    isIntOrFloat && onChangeText(value)
  }
  return (
    <Input
      keyboardType="numeric"
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={onInputValue}
      {...rest}
    />
  )
}

export default NumberInput
