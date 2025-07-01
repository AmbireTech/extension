import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AddFromCurrentRecoveryPhraseIcon: React.FC<SvgProps> = ({
  width = 30,
  height = 32,
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 29.344 31.3" {...rest}>
      <G transform="translate(0.652 2.65)">
        <Path
          d="M15995.041,18151a5.976,5.976,0,0,1-3.587-1.113l-6-4.492a6.817,6.817,0,0,1-2.414-4.82v-10.4a4.839,4.839,0,0,1,2.915-4.213l6.966-2.633a6.2,6.2,0,0,1,2.109-.326,6.385,6.385,0,0,1,2.131.326l2.871,1.08a5.533,5.533,0,0,0-.215.555,5.872,5.872,0,0,0-.287,1.818,5.653,5.653,0,0,0,.834,2.975,5.465,5.465,0,0,0,1.1,1.316,5.7,5.7,0,0,0,3.845,1.484,5.253,5.253,0,0,0,1.735-.281v8.3a6.817,6.817,0,0,1-2.414,4.82l-6,4.492A5.976,5.976,0,0,1,15995.041,18151Z"
          transform="translate(-15983.041 -18123)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.3"
        />
        <Path
          d="M3.722.181A.366.366,0,0,1,4.377.5l-.407.937a.359.359,0,0,0,.309.5l1.382.106a.358.358,0,0,1,0,.715l-1.382.106a.359.359,0,0,0-.309.5l.407.937a.366.366,0,0,1-.655.321l-.4-.681a.371.371,0,0,0-.634,0l-.4.681A.366.366,0,0,1,1.623,4.3l.407-.937a.359.359,0,0,0-.309-.5L.338,2.758a.358.358,0,0,1,0-.715l1.382-.106a.359.359,0,0,0,.309-.5L1.623.5A.366.366,0,0,1,2.278.181l.4.681a.371.371,0,0,0,.634,0Z"
          transform="translate(7.517 10.545) rotate(90)"
          fill={color || theme.iconPrimary}
        />
        <Path
          d="M3.722.181A.366.366,0,0,1,4.377.5l-.407.937a.359.359,0,0,0,.309.5l1.382.106a.358.358,0,0,1,0,.715l-1.382.106a.359.359,0,0,0-.309.5l.407.937a.366.366,0,0,1-.655.321l-.4-.681a.371.371,0,0,0-.634,0l-.4.681A.366.366,0,0,1,1.623,4.3l.407-.937a.359.359,0,0,0-.309-.5L.338,2.758a.358.358,0,0,1,0-.715l1.382-.106a.359.359,0,0,0,.309-.5L1.623.5A.366.366,0,0,1,2.278.181l.4.681a.371.371,0,0,0,.634,0Z"
          transform="translate(14.401 10.545) rotate(90)"
          fill={color || theme.iconPrimary}
        />
        <Path
          d="M3.722.181A.366.366,0,0,1,4.377.5l-.407.937a.359.359,0,0,0,.309.5l1.382.106a.358.358,0,0,1,0,.715l-1.382.106a.359.359,0,0,0-.309.5l.407.937a.366.366,0,0,1-.655.321l-.4-.681a.371.371,0,0,0-.634,0l-.4.681A.366.366,0,0,1,1.623,4.3l.407-.937a.359.359,0,0,0-.309-.5L.338,2.758a.358.358,0,0,1,0-.715l1.382-.106a.359.359,0,0,0,.309-.5L1.623.5A.366.366,0,0,1,2.278.181l.4.681a.371.371,0,0,0,.634,0Z"
          transform="translate(21.285 10.545) rotate(90)"
          fill={color || theme.iconPrimary}
        />
        <G id="Group_5193" data-name="Group 5193" transform="translate(16.488 -2)">
          <Path
            d="M26.555,6.777a5.19,5.19,0,0,1-.173,1.343,5.393,5.393,0,0,1-.664,1.632,5.629,5.629,0,0,1-3.134,2.5,5.323,5.323,0,0,1-1.805.3,5.663,5.663,0,0,1-3.842-1.488,5.32,5.32,0,0,1-1.1-1.314A5.663,5.663,0,0,1,15,6.777a5.854,5.854,0,0,1,.289-1.82,5.7,5.7,0,0,1,1.343-2.21A5.769,5.769,0,0,1,20.778,1a5.7,5.7,0,0,1,4.289,1.921A5.754,5.754,0,0,1,26.555,6.777Z"
            transform="translate(-15.002 -1)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.3"
          />
          <Path
            d="M21.815,4.98h-4.3"
            transform="translate(-13.886 0.769)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.3"
          />
          <Path
            d="M19,3.52V7.838"
            transform="translate(-13.224 0.12)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.3"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(AddFromCurrentRecoveryPhraseIcon)
