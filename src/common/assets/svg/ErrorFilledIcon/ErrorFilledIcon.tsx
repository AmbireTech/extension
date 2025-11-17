import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ErrorFilledIcon: React.FC<SvgProps> = ({ width = 14, height = 14 }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 20 20">
      <G id="error" transform="translate(-617.949 -1686.25)">
        <Path
          d="M34.9,102H29.1a3.475,3.475,0,0,0-2.12.88l-4.1,4.1A3.475,3.475,0,0,0,22,109.1v5.8a3.475,3.475,0,0,0,.88,2.12l4.1,4.1a3.475,3.475,0,0,0,2.12.88h5.8a3.475,3.475,0,0,0,2.12-.88l4.1-4.1A3.475,3.475,0,0,0,42,114.9v-5.8a3.475,3.475,0,0,0-.88-2.12l-4.1-4.1A3.475,3.475,0,0,0,34.9,102Z"
          transform="translate(595.949 1584.25)"
          fill={theme.errorDecorative}
        />
        <Path
          d="M28.5,115.5l7-7"
          transform="translate(595.949 1584.25)"
          fill="none"
          stroke={theme.primaryBackground}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <Path
          d="M35.5,115.5l-7-7"
          transform="translate(595.949 1584.25)"
          fill="none"
          stroke={theme.primaryBackground}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </G>
    </Svg>
  )
}
export default React.memo(ErrorFilledIcon)
