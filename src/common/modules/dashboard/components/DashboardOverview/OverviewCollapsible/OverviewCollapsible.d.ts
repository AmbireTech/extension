import React, { ReactNode } from 'react'
import { Animated } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'

export interface OverviewCollapsibleLayout {
  /** How tall it is right now, mid-collapse included. */
  height: number
  /** How tall it is when open. */
  expandedHeight: number
}

export interface OverviewCollapsibleProps {
  /** Drives the collapse on web. */
  animatedOverviewHeight: Animated.Value
  /** Drives the collapse on mobile, on the UI thread: 1 is open, 0 collapsed. */
  expansion?: SharedValue<number>
  /** Mobile only, lets the dashboard lay the pager out under the collapsed overview. */
  onLayoutChange?: (layout: OverviewCollapsibleLayout) => void
  children: ReactNode
}

declare const OverviewCollapsible: React.FC<OverviewCollapsibleProps>
export default OverviewCollapsible
