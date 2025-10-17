import { ReactNode } from 'react'
import { SectionListProps, TextStyle, ViewStyle } from 'react-native'

export type SelectValue = {
  value: string | number
  label: string | ReactNode
  icon?: string | ReactNode
  disabled?: boolean
  isPending?: boolean
  balanceFormatted?: string
  pendingBalanceFormatted?: string
  symbol?: string
  [key: string]: any
}

export type RenderSelectedOptionParams = {
  toggleMenu: () => void
  setIsMenuOpen: (isMenuOpen: boolean) => void
  isMenuOpen: boolean
  selectRef: any
}

export type CommonSelectProps = {
  id?: string
  value?: SelectValue | null
  setValue?: (value: SelectValue) => void
  handleSearch?: (search: string) => void
  defaultValue?: {}
  placeholder?: string
  label?: string | ReactNode
  bottomSheetTitle?: string
  size?: 'sm' | 'md'
  mode?: 'select' | 'bottomSheet'
  menuPosition?: 'top' | 'bottom'
  containerStyle?: ViewStyle
  selectStyle?: ViewStyle
  labelStyle?: TextStyle
  emptyListPlaceholderText?: string
  disabled?: boolean
  menuOptionHeight?: number
  menuStyle?: ViewStyle
  menuLeftHorizontalOffset?: number
  withSearch?: boolean
  searchPlaceholder?: string
  testID?: string
  extraSearchProps?: { [key: string]: string }
  attemptToFetchMoreOptions?: (search: string) => void
  onSearch?: (search: string) => void
  renderSelectedOption?: ({
    toggleMenu,
    isMenuOpen,
    selectRef
  }: RenderSelectedOptionParams) => ReactNode
}
export type SelectProps = CommonSelectProps & {
  options: SelectValue[]
}

export type SectionedSelectProps = CommonSelectProps &
  Pick<
    SectionListProps<SelectValue>,
    'sections' | 'renderSectionHeader' | 'SectionSeparatorComponent' | 'stickySectionHeadersEnabled'
  > & { headerHeight: number }
