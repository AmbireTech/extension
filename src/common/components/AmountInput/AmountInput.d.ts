import { ViewStyle } from 'react-native'

import { InputProps } from '@common/components/Input'

export interface AmountInputProps extends InputProps {
  type: 'fiat' | 'token'
  inputTestId?: string
  fontSize?: number
  inputWrapperStyle?: ViewStyle
  textAlign?: 'left' | 'right' | 'center'
}

declare const AmountInput: React.FC<AmountInputProps>

export default AmountInput
