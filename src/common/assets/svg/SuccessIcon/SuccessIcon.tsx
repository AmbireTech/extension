import React, { FC } from 'react'
import { G, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SuccessIcon: FC<SvgProps & { withCirc?: boolean }> = ({
  width = 24,
  height = 24,
  color,
  withCirc = true
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24">
      {withCirc ? (
        <G
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <Path d="M12 21C13.78 21 15.5201 20.4722 17.0001 19.4832C18.4802 18.4943 19.6337 17.0887 20.3149 15.4442C20.9961 13.7996 21.1743 11.99 20.8271 10.2442C20.4798 8.49836 19.6226 6.89472 18.364 5.63604C17.1053 4.37737 15.5016 3.5202 13.7558 3.17294C12.01 2.82567 10.2004 3.0039 8.55585 3.68509C6.91131 4.36628 5.50571 5.51983 4.51677 6.99987C3.52784 8.47991 3 10.22 3 12C3.00689 14.3848 3.95731 16.67 5.64364 18.3564C7.32998 20.0427 9.61517 20.9931 12 21Z" />
          <Path d="M7.75 11.9999L10.58 14.8299L16.25 9.16992" />
        </G>
      ) : (
        <G
          fill="none"
          stroke={color || theme.iconSecondary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        >
          <Path d="M7.75 11.9999L10.58 14.8299L16.25 9.16992" />
        </G>
      )}
    </Svg>
  )
}

export default React.memo(SuccessIcon)
