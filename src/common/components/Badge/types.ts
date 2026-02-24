import { TextStyle, ViewStyle } from 'react-native'

import { TextWeight } from '@common/components/Text'

type BadgeType =
  | 'info'
  | 'warning'
  | 'default'
  | 'success'
  | 'error'
  | 'primaryAccent'
  | 'secondaryAccent'
  | 'new'
  | 'outline'

type SpecialBadgeType = 'metamask' | 'safe'

type Props = {
  text: string
  textStyle?: TextStyle
  weight?: TextWeight
  type?: BadgeType
  tooltipText?: string
  style?: ViewStyle
  withRightSpacing?: boolean
  nativeID?: string
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  specialType?: SpecialBadgeType
  testId?: string
}

export type { BadgeType, Props, SpecialBadgeType }
