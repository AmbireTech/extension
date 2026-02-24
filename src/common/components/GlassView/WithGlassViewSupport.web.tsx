import React, { FC } from 'react'

import { WithGlassViewSupportProps } from './types'

const WithGlassViewSupport: FC<WithGlassViewSupportProps> = ({ children }) => {
  return (
    <>
      {children}
      {/* Done to render only one svg filter per page and avoid performance issues when multiple glass views are rendered */}
      <svg style={{ display: 'none' }}>
        <filter
          id="glass-distortion"
          colorInterpolationFilters="sRGB"
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.004 0.004"
            numOctaves="1"
            seed="92"
            stitchTiles="stitch"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="turbulence"
          />
          <feGaussianBlur
            stdDeviation="2 10"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            in="turbulence"
            edgeMode="none"
            result="blur"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blur"
            scale="98"
            xChannelSelector="R"
            yChannelSelector="G"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="displacementMap"
          />
        </filter>
      </svg>
    </>
  )
}

export default WithGlassViewSupport
