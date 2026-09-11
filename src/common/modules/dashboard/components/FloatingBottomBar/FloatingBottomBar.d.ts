import React from 'react'
import { Control } from 'react-hook-form'

import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'

export interface FloatingBottomBarProps {
  /** Left out by a page without a search field, which then gets a bar with no search in it. */
  control?: Control<{ search: string }, any>
  displayCurrentApp?: boolean
  /** The tab of the page the bar belongs to. Set it to put the network picker in the bar. */
  networkFilterTab?: TabType
  isHidden: boolean
  searchPlaceholder?: string
}

declare const FloatingBottomBar: React.FC<FloatingBottomBarProps>
export default FloatingBottomBar
