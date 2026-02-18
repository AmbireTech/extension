import './RefreshIcon.css'

import React, { memo } from 'react'
import { SvgProps } from 'react-native-svg'

import RefreshSvg from '@common/assets/svg/RefreshIcon'

// We are setting the width and height for both the wrapping div and the SVG.
// Otherwise, the spinning animation breaks.
const RefreshIcon = ({
  color,
  spin,
  width,
  height
}: {
  color?: SvgProps['color']
  spin?: boolean
  width: SvgProps['width']
  height: SvgProps['height']
}) => {
  return (
    <div className={spin ? 'spinAnimation' : ''} style={{ width, height }}>
      <RefreshSvg color={color} width={width} height={height} />
    </div>
  )
}

export default memo(RefreshIcon)
