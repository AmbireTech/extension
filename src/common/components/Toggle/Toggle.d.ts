import { FC, ReactNode } from 'react'
import { TextProps, ViewStyle } from 'react-native'

export type ToggleProps = {
  id?: string
  isOn: boolean
  onToggle: (isOn: boolean) => any
  label?: string
  style?: any
  disabled?: boolean
  testID?: string
  labelProps?: TextProps
  toggleStyle?: ViewStyle
  trackStyle?: ViewStyle
  children?: ReactNode
}

declare const Toggle: FC<ToggleProps>
export default Toggle
