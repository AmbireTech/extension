import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const EditAccountIcon: React.FC<SvgProps> = ({ width = 72, height = 72, color }) => {
  const { theme } = useTheme()
  const strokeColor = color || theme.tertiaryText

  return (
    <Svg width={width} height={height} viewBox="0 0 72 72" fill="none">
      <Circle cx="36" cy="36" r="36" fill={theme.secondaryBackground} />
      <Circle
        cx="36"
        cy="30.6665"
        r="8"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M31.8324 59.6354C28.1025 58.9777 24.5812 57.4466 21.5564 55.1673C18.5316 52.8879 16.0893 49.925 14.4289 46.5209C12.7686 43.1168 11.9376 39.368 12.0037 35.5811C12.0698 31.7943 13.0312 28.0768 14.8093 24.7327C16.5874 21.3886 19.1317 18.5127 22.2342 16.3403C25.3367 14.168 28.9093 12.7607 32.6598 12.2336C36.4104 11.7065 40.2325 12.0745 43.8136 13.3076C47.3947 14.5406 50.6332 16.6037 53.2642 19.3282"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M20 53.8824C20.9438 51.0473 23.0233 48.5421 25.9162 46.7553C28.8091 44.9685 32.3536 44 36 44C37.7078 44 39.3933 44.2125 41 44.6219"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Path
        d="M50.9395 41.1457L54.0673 38.0179C55.4245 36.6607 57.6249 36.6607 58.9821 38.0179C60.3393 39.3751 60.3393 41.5756 58.9821 42.9327L45.4931 56.4218C44.5132 57.4017 43.3046 58.122 41.9765 58.5176L37 60L38.4824 55.0236C38.878 53.6955 39.5983 52.4868 40.5782 51.5069L50.9395 41.1457ZM50.9395 41.1457L55.8296 46.0358"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M54.333 29.667L53 27L51.667 29.667L49 31L51.667 32.333L53 35L54.333 32.333L57 31L54.333 29.667Z"
        fill={strokeColor}
      />
      <Path
        d="M60.9995 22.0005L59 18L57.0005 22.0005L53 24L57.0005 25.9995L59 30L60.9995 25.9995L65 24L60.9995 22.0005Z"
        fill={strokeColor}
      />
      <Path
        d="M62.6665 32.3335L62 31L61.3335 32.3335L60 33L61.3335 33.6665L62 35L62.6665 33.6665L64 33L62.6665 32.3335Z"
        fill={strokeColor}
      />
    </Svg>
  )
}

export default React.memo(EditAccountIcon)
