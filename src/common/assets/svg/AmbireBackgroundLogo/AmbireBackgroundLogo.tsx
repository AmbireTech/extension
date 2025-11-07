import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const AmbireBackgroundLogo: React.FC<SvgProps> = ({ color = '#2d2467', ...props }) => {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 334.865 503.036" {...props}>
      <G
        id="new_logo_Ambire_"
        data-name="new logo Ambire "
        transform="translate(0 -0.008)"
        opacity="0.82"
      >
        <Path
          id="Path_17967"
          data-name="Path 17967"
          d="M166.7,30.191l-31.05,88.1a3.869,3.869,0,0,0,.2,3.041l29,56.97L85.163,223.424a1.941,1.941,0,0,1-2.7-.847L65.226,186.7a3.865,3.865,0,0,1,.254-3.8L166.007,29.837a.389.389,0,0,1,.686.076A.4.4,0,0,1,166.7,30.191Z"
          transform="translate(-54.235 41.629)"
          fill={color}
        />
        <Path
          id="Path_17968"
          data-name="Path 17968"
          d="M188.12,39.294l66,140.586a3.871,3.871,0,0,1-.812,4.427L79.767,351.94a1.942,1.942,0,0,1-3.292-1.393V196.427L185.9,90.854a3.889,3.889,0,0,0,1.185-2.759l.3-48.64a.389.389,0,0,1,.739-.158Z"
          transform="translate(80.377 150.558)"
          fill={color}
        />
        <Path
          id="Path_17973"
          data-name="Path 17973"
          d="M222.3,24.476l73.279,179.507a3.857,3.857,0,0,1-.023,2.974L177.192,483.881a1.94,1.94,0,0,1-3.132.629L65.183,379.353a3.876,3.876,0,0,1-.426-5.088l155.3-210.378a3.889,3.889,0,0,0,.755-2.3V24.755a.778.778,0,0,1,1.492-.284Z"
          transform="translate(-64 -23.992)"
          fill={color}
        />
      </G>
    </Svg>
  )
}

export default React.memo(AmbireBackgroundLogo)
