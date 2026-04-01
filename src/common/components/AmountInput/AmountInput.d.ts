import { InputProps } from '@common/components/Input'

export interface AmountInputProps extends InputProps {
  type: 'fiat' | 'token'
  inputTestId?: string
}

declare const AmountInput: React.FC<AmountInputProps>

export default AmountInput
