import React, { ReactNode } from 'react'

import type { OverviewCollapse } from '../DashboardPagesCarousel/DashboardPagesCarousel'

/** Where the image layer covers the open card, and how it moves as the card collapses. */
export interface CollapsingLayerGeometry {
  width: number
  height: number
  left: number
  top: number
  /** How far the card collapses before its width, not its height, decides the cover size. */
  heightBoundCollapse: number
  /** How small the layer gets once the card's width decides the cover size. */
  minScale: number
}

export interface OverviewBackgroundLayerProps {
  /** `null` until the card is measured, or without a collapse to move by: covers the card. */
  geometry: CollapsingLayerGeometry | null
  collapse?: OverviewCollapse
  children: ReactNode
}

/**
 * Moves the background image as the overview collapses: by native animated nodes on mobile
 * and by Reanimated on web, the same way the carousel moves the pages over it.
 */
declare const OverviewBackgroundLayer: React.FC<OverviewBackgroundLayerProps>
export default OverviewBackgroundLayer
