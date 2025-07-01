import { ReactNode } from 'react'
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
  toggleStyle?: React.CSSProperties | ViewStyle
  trackStyle?: React.CSSProperties | ViewStyle
  children?: ReactNode
}
