import React from 'react'
import Svg, { G, Path, Rect } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const AmbireDevice: React.FC<any> = (props) => {
  const { theme } = useTheme()
  return (
    <Svg width="144" height="94" viewBox="0 0 122 79.557" {...props}>
      <G id="laptop_light" data-name="laptop light" transform="translate(0 -0.444)">
        <Rect
          width="122"
          height="6"
          rx="3"
          transform="translate(0 74.001)"
          fill={theme.iconPrimary}
        />
        <G
          transform="translate(10 4.444)"
          fill={theme.secondaryBackground}
          stroke={theme.iconPrimary}
          strokeWidth="4"
        >
          <Rect width="101.111" height="61.111" rx="2" stroke="none" />
          <Rect x="-2" y="-2" width="105.111" height="65.111" rx="4" fill="none" />
        </G>
        <G transform="translate(50.515 19.25)">
          <Path
            d="M71.222,29.7l-1.944,5.517a.242.242,0,0,0,.013.19l1.816,3.567L66.116,41.8a.122.122,0,0,1-.169-.053L64.868,39.5a.242.242,0,0,1,.016-.238l6.295-9.585a.024.024,0,0,1,.043,0A.025.025,0,0,1,71.222,29.7Z"
            transform="translate(-64.18 -25.199)"
            fill="#6c38f7"
          />
          <Path
            id="Path_17968"
            data-name="Path 17968"
            d="M83.465,39.091l4.133,8.8a.242.242,0,0,1-.051.277L76.68,58.668a.122.122,0,0,1-.206-.087V48.93l6.852-6.611a.243.243,0,0,0,.074-.173l.019-3.046a.024.024,0,0,1,.046-.01Z"
            transform="translate(-66.652 -27.202)"
            fill="#6c38f7"
          />
          <Path
            id="Path_17969"
            data-name="Path 17969"
            d="M71.2,41.486l-5.929,1.171.771,1.6a.122.122,0,0,0,.17.053l4.99-2.827Z"
            transform="translate(-64.269 -27.714)"
            fill="#232059"
            opacity="0.76"
          />
          <Path
            d="M69.267,35.289l-4.408,4.04a.246.246,0,0,1,.028-.057l6.3-9.585a.024.024,0,0,1,.02-.011.025.025,0,0,1,.024.033l-1.944,5.515a.242.242,0,0,0-.015.065Z"
            transform="translate(-64.183 -25.21)"
            fill="#9d7aff"
          />
          <Path
            d="M80.435,46.736,76.473,56V50.559Z"
            transform="translate(-66.651 -28.829)"
            fill="#232059"
            opacity="0.76"
          />
          <Path
            d="M89.476,48.044,85.224,42.27a.241.241,0,0,0,.035-.125l.019-3.046a.017.017,0,0,1,0-.017h.008a.025.025,0,0,1,.022,0,.023.023,0,0,1,.009.01l4.133,8.8a.241.241,0,0,1,.021.157Z"
            transform="translate(-68.511 -27.202)"
            fill="#9d7aff"
          />
          <Path
            d="M73.913,24.03,78.5,35.27a.241.241,0,0,1,0,.186L71.088,52.8a.122.122,0,0,1-.2.039L64.07,46.254a.243.243,0,0,1-.027-.319L73.772,32.76a.244.244,0,0,0,.047-.144V24.047a.049.049,0,0,1,.093-.018Z"
            transform="translate(-64 -24)"
            fill="#6c38f7"
          />
          <Path
            d="M76.456,32.688l4.711,2.663a.243.243,0,0,0-.018-.081L76.56,24.03a.047.047,0,0,0-.045-.03.05.05,0,0,0-.046.03.048.048,0,0,0,0,.019v8.568a.245.245,0,0,1-.011.071Z"
            transform="translate(-66.648 -24)"
            fill="#9d7aff"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(AmbireDevice)
