import { ViewStyle } from 'react-native'

import { InputProps } from '@common/components/Input'

export interface AmountInputProps extends InputProps {
  type: 'fiat' | 'token'
  inputTestId?: string
  fontSize?: number
  inputWrapperStyle?: ViewStyle
}

declare const AmountInput: React.FC<AmountInputProps>

export default AmountInput
