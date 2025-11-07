import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const FailedToConnectIcon: React.FC<SvgProps> = ({ width = 39, height = 50, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 38.903 50.035" {...rest}>
      <G id="failed_to_connect" data-name="failed to connect" transform="translate(-1.03 -1.435)">
        <G id="Group_5697" data-name="Group 5697" transform="translate(9.363 37.548)">
          <Path
            id="Path_18130"
            data-name="Path 18130"
            d="M12,16v5.538"
            transform="translate(-0.924 -16)"
            fill="none"
            stroke={theme.warningDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Path
            id="Path_18131"
            data-name="Path 18131"
            d="M13.692,26.384A3.692,3.692,0,1,0,10,22.692,3.692,3.692,0,0,0,13.692,26.384Z"
            transform="translate(-2.616 -13.462)"
            fill="none"
            stroke={theme.warningDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Path
            id="Path_18132"
            data-name="Path 18132"
            d="M21.384,21H14"
            transform="translate(0.768 -11.77)"
            fill="none"
            stroke={theme.warningDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Path
            id="Path_18133"
            data-name="Path 18133"
            d="M13.384,21H6"
            transform="translate(-6 -11.77)"
            fill="none"
            stroke={theme.warningDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </G>
        <G id="Group_5699" data-name="Group 5699" transform="translate(2.03 2.47)">
          <Path
            id="Path_18136"
            data-name="Path 18136"
            d="M8.509,11.12c-8.639.609-8.639,13.18,0,13.789h3.544"
            transform="translate(-2.03 4.848)"
            fill="none"
            stroke={theme.warningDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Path
            id="Path_18137"
            data-name="Path 18137"
            d="M6,18.437C.079,1.953,25.074-4.637,27.935,12.678c7.993,1.015,11.223,11.666,5.169,16.964a9.849,9.849,0,0,1-6.719,2.584h-.166"
            transform="translate(0.567 -2.47)"
            fill="none"
            stroke={theme.warningDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </G>
        <G id="Group_5698" data-name="Group 5698" transform="translate(11.205 19.194)">
          <Path
            id="Path_18134"
            data-name="Path 18134"
            d="M14.755,19.395,10.86,15.5"
            transform="translate(-3.735 -8.172)"
            fill="none"
            stroke={theme.warningDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Path
            id="Path_18135"
            data-name="Path 18135"
            d="M14.744,15.52,10.83,19.433"
            transform="translate(-3.76 -8.155)"
            fill="none"
            stroke={theme.warningDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Path
            id="Path_18138"
            data-name="Path 18138"
            d="M25.46,20.76a8.7,8.7,0,0,1-.849,3.8,7.588,7.588,0,0,1-.5.941,9.168,9.168,0,0,1-15.765,0,7.588,7.588,0,0,1-.5-.941A8.7,8.7,0,0,1,7,20.76a9.23,9.23,0,1,1,18.46,0Z"
            transform="translate(-7 -11.53)"
            fill="none"
            stroke={theme.warningDecorative}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(FailedToConnectIcon)
