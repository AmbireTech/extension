import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const KeyStoreSettingsIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 17.5 24.973" {...rest}>
      <G>
        <G>
          <G>
            <Path
              d="M8.799 21.484 7.455 20.14v-3.57a2.974 2.974 0 0 1-1.686-2.7 3 3 0 1 1 4.328 2.686v.32l-.523.523.523.742-.523.738.8.885-1.576 1.715Zm-.035-9.543a.966.966 0 1 0 .967.963.964.964 0 0 0-.967-.963Z"
              fill={color || theme.iconSecondary}
            />
          </G>
          <Path
            d="M2.75 9.749v-3a6 6 0 0 1 6-6 6 6 0 0 1 6 6v2.994l-4.586-1.482a5 5 0 0 0-1.421-.184 4.863 4.863 0 0 0-1.408.184L2.75 9.749Z"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            d="m7.34 8.261-4.642 1.5A2.824 2.824 0 0 0 .75 12.177v5.945a3.733 3.733 0 0 0 1.609 2.752l4 2.568a4.811 4.811 0 0 0 4.781 0l4-2.568a3.733 3.733 0 0 0 1.609-2.752v-5.945a2.824 2.824 0 0 0-1.943-2.42l-4.642-1.5a5.467 5.467 0 0 0-2.824.004Z"
            fill="none"
            stroke={color || theme.iconSecondary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(KeyStoreSettingsIcon)
