import React from 'react'
import { Control } from 'react-hook-form'
import type { SharedValue } from 'react-native-reanimated'

import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'

export interface FloatingBottomBarProps {
  /** Left out by a page without a search field, which then gets a bar with no search in it. */
  control?: Control<{ search: string }, any>
  displayCurrentApp?: boolean
  /** The tab of the page the bar belongs to. Set it to put the network picker in the bar. */
  networkFilterTab?: TabType
  isHidden: boolean
  /** Mobile only, hides it as `isHidden` does but without re-rendering anything. */
  isHiddenValue?: SharedValue<boolean>
  searchPlaceholder?: string
}

declare const FloatingBottomBar: React.FC<FloatingBottomBarProps>
export default FloatingBottomBar
