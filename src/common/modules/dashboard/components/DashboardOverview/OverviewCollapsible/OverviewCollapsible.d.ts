import React, { ReactNode } from 'react'
import { Animated } from 'react-native'

export interface OverviewCollapsibleProps {
  /** Drives the collapse on web. */
  animatedOverviewHeight?: Animated.Value
  /**
   * Mobile only, where the overview is never resized: the pages slide over the collapsible
   * part instead, as resizing it would redraw the filtered background every frame.
   */
  onHeightChange?: (height: number) => void
  children: ReactNode
}

declare const OverviewCollapsible: React.FC<OverviewCollapsibleProps>
export default OverviewCollapsible
