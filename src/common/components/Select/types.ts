import { ReactNode } from 'react'
import { SectionListProps, TextStyle, ViewStyle } from 'react-native'

export type SelectValue = {
  value: string | number
  label: string | ReactNode
  icon?: string | ReactNode
  [key: string]: any
}

export type CommonSelectProps = {
  value: SelectValue
  setValue?: (value: SelectValue) => void
  handleSearch?: (search: string) => void
  defaultValue?: {}
  placeholder?: string
  label?: string
  containerStyle?: ViewStyle
  selectStyle?: ViewStyle
  labelStyle?: TextStyle
  disabled?: boolean
  menuOptionHeight?: number
  menuStyle?: ViewStyle
  withSearch?: boolean
}
export type SelectProps = CommonSelectProps & {
  options: SelectValue[]
}

export type SectionedSelectProps = CommonSelectProps & {
  sections: SectionListProps<SelectValue>['sections']
}
