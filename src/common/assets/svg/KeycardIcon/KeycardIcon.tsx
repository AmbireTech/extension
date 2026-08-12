import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const MARK_SCALE = 0.3676
const MARK_TRANSFORM = `translate(8.415 5.75) scale(${MARK_SCALE})`

const KeycardIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  const iconColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        stroke={iconColor}
        strokeWidth="1.5"
        d="M12 2.75a9.25 9.25 0 1 1 0 18.5 9.25 9.25 0 0 1 0-18.5Z"
      />
      <G transform={MARK_TRANSFORM}>
        <Path
          fill={iconColor}
          d="M8.388 16.85C3.74 16.85 0 13.017 0 8.376A8.361 8.361 0 0 1 8.388 0a8.361 8.361 0 0 1 8.389 8.375c.1 4.642-3.74 8.476-8.389 8.476Zm0-13.52c-2.83 0-5.053 2.32-5.053 5.045 0 2.825 2.325 5.045 5.053 5.045 2.83 0 5.053-2.32 5.053-5.045.101-2.724-2.223-5.045-5.053-5.045Z"
        />
        <Path
          fill={iconColor}
          d="m15.564 34.005-4.043-5.853-1.212 1.413v4.44H6.67V13.52h3.639v11.503h.202l4.447-5.247h4.244l-5.255 6.055 5.559 8.173h-3.942Z"
        />
      </G>
    </Svg>
  )
}

export default React.memo(KeycardIcon)
