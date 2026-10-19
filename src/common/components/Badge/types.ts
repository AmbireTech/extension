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
  | 'privacyPools'
  | 'new'
  | 'outline'

type SpecialBadgeType = 'metamask' | 'safe' | 'privacy-pools' | 'tornado-cash'

type Props = {
  /** Can be left out when `children` render the whole content, e.g. an icon before the text */
  text?: string
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
  /** Puts the icons (`children` and the tooltip's) before the text instead of after it */
  isIconLeading?: boolean
  /** Shows the tooltip on hover over the whole badge, instead of on an info icon */
  isTooltipOnBadge?: boolean
}

export type { BadgeType, Props, SpecialBadgeType }
