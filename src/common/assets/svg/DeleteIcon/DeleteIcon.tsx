import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const DeleteIcon: React.FC<SvgProps> = ({
  width = 20,
  height = 22,
  color,
  strokeWidth = '1.5',
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 19.64 21.5" {...rest}>
      <G transform="translate(0.82 0.75)">
        <Path
          d="M41,25.98c-3.33-.33-6.68-.5-10.02-.5a59.068,59.068,0,0,0-5.94.3l-2.04.2"
          transform="translate(-23 -22)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <Path
          d="M28.5,24.97l.22-1.31c.16-.95.28-1.66,1.97-1.66h2.62c1.69,0,1.82.75,1.97,1.67l.22,1.3"
          transform="translate(-23 -22)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <Path
          d="M38.85,29.14,38.2,39.21C38.09,40.78,38,42,35.21,42H28.79c-2.79,0-2.88-1.22-2.99-2.79l-.65-10.07"
          transform="translate(-23 -22)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <Path
          d="M30.33,36.5h3.33"
          transform="translate(-23 -22)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <Path
          d="M29.5,32.5h5"
          transform="translate(-23 -22)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
      </G>
    </Svg>
  )
}

export default React.memo(DeleteIcon)
