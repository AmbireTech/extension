import React, { FC } from 'react'

import { WithGlassViewSupportProps } from './types'

const WithGlassViewSupport: FC<WithGlassViewSupportProps> = ({ children }) => {
  return (
    <>
      {children}
      {/* Done to render only one svg filter per page and avoid performance issues when multiple glass views are rendered */}
      <svg style={{ display: 'none' }}>
        <filter id="container-filter" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008 0.008"
            numOctaves="2"
            seed="92"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blur"
            scale="77"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </>
  )
}

export default WithGlassViewSupport
