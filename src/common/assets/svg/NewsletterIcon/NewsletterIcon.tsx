import React, { FC } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const NewsletterIcon: FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg viewBox="0 0 25.5 21.9" width={width} height={height} {...rest}>
      <G
        fill="none"
        stroke={color || theme.iconPrimary}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <Path d="M.75 6.75c0-4.2 2.4-6 6-6h12c3.6 0 6 1.8 6 6v8.4c0 4.2-2.4 6-6 6h-12" />
        <Path d="m18.75 7.35-3.756 3a3.8 3.8 0 0 1-4.5 0l-3.744-3" />
        <Path d="M.75 16.35h7.2" />
        <Path d="M.75 11.55h3.6" />
      </G>
    </Svg>
  )
}

export default React.memo(NewsletterIcon)
