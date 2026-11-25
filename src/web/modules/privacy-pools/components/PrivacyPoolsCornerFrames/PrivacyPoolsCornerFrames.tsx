import React, { useId, useMemo } from 'react'
import { Defs, FeGaussianBlur, Filter, Path, Svg } from 'react-native-svg'

import styles from './styles'

/** Room for the corner frame and its glow, which fades out about three blurs from it */
const CORNER_SIZE = 40
/** The straight part of each side of a corner frame */
const CORNER_ARM_LENGTH = 8
const STROKE_WIDTH = 1.5

interface Props {
  color: string
  /** How far the glow spreads around each frame */
  glowBlur: number
  /** How far each corner frame sits from the container's left and right edges */
  insetX: number
  insetTop: number
  insetBottom: number
  /**
   * The radius of the corners the frames curve around, usually the container's own. The
   * frames' curves share their centers, with a radius smaller by the inset.
   */
  cornerRadius: number
}

/**
 * The top-left corner frame, `insetX` and `insetY` from the container's edges. Its curve runs
 * alongside a rounded corner of `cornerRadius` - same center, radius smaller by the inset -
 * flipped for the others.
 */
const getCornerPath = (insetX: number, insetY: number, cornerRadius: number) => {
  const curveEnd = cornerRadius
  const armEnd = curveEnd + CORNER_ARM_LENGTH
  const radiusX = cornerRadius - insetX
  const radiusY = cornerRadius - insetY

  return `M${insetX} ${armEnd}V${curveEnd}A${radiusX} ${radiusY} 0 0 1 ${curveEnd} ${insetY}H${armEnd}`
}

const CORNERS = [
  { id: 'top-left', edge: 'top', style: styles.topLeft },
  { id: 'top-right', edge: 'top', style: styles.topRight },
  { id: 'bottom-left', edge: 'bottom', style: styles.bottomLeft },
  { id: 'bottom-right', edge: 'bottom', style: styles.bottomRight }
] as const

/**
 * Glowing frames in the four corners of a Privacy Pools card, as the design draws them over its
 * background. Positioned absolutely, so the card they frame must be their parent.
 */
const PrivacyPoolsCornerFrames = ({
  color,
  glowBlur,
  insetX,
  insetTop,
  insetBottom,
  cornerRadius
}: Props) => {
  // A `url(#id)` reference resolves to the first matching id in the document, and two cards with
  // frames can be mounted at the same time - so every instance needs its own filter ids
  const filterIdPrefix = useId().replaceAll(':', '')

  const paths = useMemo(
    () => ({
      top: getCornerPath(insetX, insetTop, cornerRadius),
      bottom: getCornerPath(insetX, insetBottom, cornerRadius)
    }),
    [cornerRadius, insetBottom, insetTop, insetX]
  )

  return (
    <>
      {CORNERS.map(({ id, edge, style }) => (
        <Svg
          key={id}
          width={CORNER_SIZE}
          height={CORNER_SIZE}
          viewBox={`0 0 ${CORNER_SIZE} ${CORNER_SIZE}`}
          fill="none"
          style={style}
        >
          <Defs>
            {/* Over the whole corner - by default it cuts the glow off in a square near the frame */}
            <Filter
              id={`${filterIdPrefix}-${id}`}
              filterUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={CORNER_SIZE}
              height={CORNER_SIZE}
            >
              <FeGaussianBlur stdDeviation={glowBlur} />
            </Filter>
          </Defs>
          <Path
            d={paths[edge]}
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            filter={`url(#${filterIdPrefix}-${id})`}
          />
          <Path d={paths[edge]} stroke={color} strokeWidth={STROKE_WIDTH} />
        </Svg>
      ))}
    </>
  )
}

export default React.memo(PrivacyPoolsCornerFrames)
