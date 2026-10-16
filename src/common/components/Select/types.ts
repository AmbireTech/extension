import { ReactNode } from 'react'
import { SectionListData, SectionListProps, TextStyle, ViewStyle } from 'react-native'

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

/** What `renderOption` receives to draw a custom row in place of the default one */
export type RenderOptionParams = {
  item: SelectValue
  isSelected: boolean
  /** The last row of the whole (filtered) list */
  isLast: boolean
  onPress: (item: SelectValue) => void
}

export type CommonSelectProps = {
  id?: string
  value?: SelectValue | null
  setValue?: (value: SelectValue) => void
  clearValue?: () => void
  handleSearch?: (search: string) => void
  defaultValue?: {}
  placeholder?: string
  label?: string | ReactNode
  bottomSheetTitle?: string
  size?: 'sm' | 'md'
  mode?: 'select' | 'bottomSheet'
  menuPosition?: 'top' | 'bottom'
  containerStyle?: ViewStyle
  selectBorderWrapperStyle?: ViewStyle
  selectStyle?: ViewStyle
  hoveredSelectStyle?: ViewStyle
  labelStyle?: TextStyle
  emptyListPlaceholderText?: string
  disabled?: boolean
  menuOptionHeight?: number
  menuStyle?: ViewStyle
  menuProps?: {
    x?: number
    y?: number
    height?: number
    width?: number
    position?: 'top' | 'bottom'
    maxDynamicHeight?: number
    windowHeight?: number
  }
  menuLeftHorizontalOffset?: number
  withSearch?: boolean
  withClearButton?: boolean
  searchPlaceholder?: string
  testID?: string
  extraSearchProps?: { [key: string]: string }
  renderHeaderChildren?: ({
    toggleMenu,
    isMenuOpen,
    selectRef
  }: RenderSelectedOptionParams) => ReactNode
  onBottomSheetClosed?: () => void
  // Opens the bottom sheet at full height (perfect for autoFocus to prevent layout shifts)
  isBottomSheetFullHeight?: boolean
  attemptToFetchMoreOptions?: (search: string) => void
  onSearch?: (search: string) => void
  renderSelectedOption?: ({
    toggleMenu,
    isMenuOpen,
    selectRef
  }: RenderSelectedOptionParams) => ReactNode
  /** Draws each row instead of the default option. It must keep the `menuOptionHeight` height */
  renderOption?: (params: RenderOptionParams) => ReactNode
  /** Set to false to keep the menu open after an option is picked. Defaults to true */
  closeMenuOnSelect?: boolean
  /** Rendered below the list, pinned to the bottom of the bottom sheet */
  renderBottomSheetFooter?: (params: RenderSelectedOptionParams) => ReactNode
  /** Set to false to hide the back arrow next to the bottom sheet title on web. Defaults to true */
  withBottomSheetBackButton?: boolean
}
export type SelectProps = CommonSelectProps & {
  options: SelectValue[]
}

export type SectionedSelectProps = CommonSelectProps &
  Pick<
    SectionListProps<SelectValue>,
    | 'sections'
    | 'renderSectionHeader'
    | 'SectionSeparatorComponent'
    | 'stickySectionHeadersEnabled'
    | 'onViewableItemsChanged'
    | 'viewabilityConfig'
    | 'onScrollBeginDrag'
  > & {
    headerHeight: number
    /** Opens the list scrolled to the selected option instead of the top */
    scrollToSelectedOnOpen?: boolean
    /** Use when section headers differ in height. Falls back to `headerHeight` */
    getSectionHeaderHeight?: (section: SectionListData<SelectValue>) => number
    /** Controls the menu from outside, e.g. when it's opened from elsewhere than its trigger */
    isMenuOpen?: boolean
    setIsMenuOpen?: (isMenuOpen: boolean) => void
    /** Keeps the rows off the scrollbar on web, like ScrollableWrapper does */
    withScrollbarPadding?: boolean
  }
