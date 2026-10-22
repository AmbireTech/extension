import React, { createContext, RefObject, useContext, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

import type { OverviewCollapse } from '../DashboardPagesCarousel/DashboardPagesCarousel'
import { OverviewBackground } from './OverviewBackground'

export interface OverviewBackdrop {
  address: string
  collapse?: OverviewCollapse
  /** The card the background covers, which the blurred copies are lined up with. */
  cardRef: RefObject<View | null>
}

/** Provided by the overview card, so the controls on it can blur its background. */
export const OverviewBackdropContext = createContext<OverviewBackdrop | null>(null)

interface Frame {
  left: number
  top: number
  width: number
  height: number
}

const isSameFrame = (a: Frame | null, b: Frame) =>
  !!a && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height

interface Props {
  width: number
  height: number
  blurRadius: number
  borderRadius?: number
}

/**
 * Web only. Stands in for a backdrop blur on a control on the overview card: draws a blurred
 * copy of the card's background, lined up with it and moved with it as it collapses. A real
 * `backdrop-filter` under the pages makes Chromium drop the pages for a frame as they settle
 * over it.
 */
const OverviewBackdropBlur = ({
  width,
  height,
  blurRadius,
  borderRadius = BORDER_RADIUS_PRIMARY
}: Props) => {
  const backdrop = useContext(OverviewBackdropContext)
  const ref = useRef<View>(null)
  // Where the card is relative to this view
  const [cardFrame, setCardFrame] = useState<Frame | null>(null)
  const cardRef = backdrop?.cardRef

  useEffect(() => {
    const element = ref.current as unknown as HTMLElement | null
    const card = cardRef?.current as unknown as HTMLElement | null

    if (!element || !card) return undefined

    // Runs once on observe as well, which takes the first measurement
    const observer = new ResizeObserver(() => {
      const ownRect = element.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      const nextFrame = {
        left: cardRect.left - ownRect.left,
        top: cardRect.top - ownRect.top,
        width: cardRect.width,
        height: cardRect.height
      }

      setCardFrame((prev) => (isSameFrame(prev, nextFrame) ? prev : nextFrame))
    })

    observer.observe(card)
    observer.observe(element)

    return () => observer.disconnect()
  }, [cardRef])

  return (
    <View
      ref={ref}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        borderRadius,
        overflow: 'hidden'
      }}
    >
      {!!backdrop && !!cardFrame && (
        <View style={{ position: 'absolute', ...cardFrame }}>
          <OverviewBackground
            address={backdrop.address}
            collapse={backdrop.collapse}
            blurRadius={blurRadius}
          />
        </View>
      )}
    </View>
  )
}

export default React.memo(OverviewBackdropBlur)
