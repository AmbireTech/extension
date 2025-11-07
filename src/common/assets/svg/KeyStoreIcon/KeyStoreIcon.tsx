import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
  props?: SvgProps
}

const KeyStoreIcon: React.FC<Props> = ({ width = 64, height = 68, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 64 68" {...rest}>
      <G id="Key_Store_icon" data-name="Key Store icon" transform="translate(-3 -6.001)">
        <G transform="translate(-3.133 -8.073)">
          <G transform="translate(8 4.001)">
            <G transform="translate(8.133 12.072)">
              <G transform="translate(13.687 27.765)">
                <Path
                  d="M8.262,29.128v-.005L4.6,25.436v-9.8a8.185,8.185,0,1,1,7.207-.027v.879l-1.428,1.436L11.8,19.964l-1.428,2.026,2.184,2.428-4.3,4.706Zm-.1-26.186A2.65,2.65,0,1,0,10.8,5.584,2.636,2.636,0,0,0,8.166,2.942Z"
                  fill="none"
                />
              </G>
              <Path
                d="M-843.8,16874.723v-8.254a16.423,16.423,0,0,1,16.32-16.488,16.423,16.423,0,0,1,16.32,16.488v8.234l-12.473-4.078a13.36,13.36,0,0,0-3.864-.506,13.007,13.007,0,0,0-3.83.506l-12.47,4.092Z"
                transform="translate(849.298 -16849.98)"
                fill="none"
                stroke={theme.successDecorative}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              <Path
                d="M21.372,2.508,8.712,6.631c-2.918.943-5.3,3.926-5.3,6.6v16.3A10.243,10.243,0,0,0,7.8,37.075l10.909,7.041a13.062,13.062,0,0,0,13.04,0l10.909-7.041a10.243,10.243,0,0,0,4.389-7.545v-16.3c0-2.7-2.385-5.681-5.3-6.624l-12.66-4.1A14.835,14.835,0,0,0,21.372,2.508Z"
                transform="translate(-3.41 18.141)"
                fill="none"
                stroke={theme.successDecorative}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
              />
              <G transform="translate(7.846 41.274) rotate(-45)">
                <Path
                  d="M17.619,12.774a7.526,7.526,0,0,1-7.528,1.874L5.415,19.314a1.925,1.925,0,0,1-1.476.489l-2.157-.29A1.853,1.853,0,0,1,.3,18.033l-.29-2.157A2,2,0,0,1,.5,14.4L5.167,9.734a7.5,7.5,0,1,1,12.452,3.04Z"
                  transform="translate(0 0)"
                  fill="none"
                  stroke={theme.successDecorative}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                />
                <Path d="M0,0,2.269,2.269" transform="translate(4.844 15.347)" fill="none" />
                <Path
                  d="M2.169,4.351A2.192,2.192,0,0,0,4.351,2.169,2.16,2.16,0,0,0,2.182,0,2.192,2.192,0,0,0,0,2.182,2.16,2.16,0,0,0,2.169,4.351Z"
                  transform="translate(10.224 5.238)"
                  fill={theme.successDecorative}
                />
              </G>
            </G>
          </G>
        </G>
      </G>
    </Svg>
  )
}
export default React.memo(KeyStoreIcon)
