import React, { FC } from 'react'
import { Circle, G, Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'

const BackgroundShapes: FC<SvgProps> = (props) => {
  const { themeType, theme } = useTheme()
  return (
    <Svg viewBox="0 0 512 260" {...props}>
      <G fill="none">
        <G
          stroke="#6000ff"
          strokeWidth="3"
          opacity={themeType === THEME_TYPES.DARK ? '.44' : '.24'}
          transform="translate(79 151)"
        >
          <Circle cx="11" cy="11" r="11" stroke="none" />
          <Circle cx="11" cy="11" r="9.5" />
        </G>
        <G
          stroke="#35058e"
          strokeWidth="3"
          opacity={themeType === THEME_TYPES.DARK ? '.44' : '.24'}
          transform="translate(479)"
        >
          <Circle cx="5.5" cy="5.5" r="5.5" stroke="none" />
          <Circle cx="5.5" cy="5.5" r="4" />
        </G>
        <G
          stroke="#8b3dff"
          strokeWidth="3"
          opacity={themeType === THEME_TYPES.DARK ? '.44' : '.24'}
          transform="translate(494 146)"
        >
          <Circle cx="9" cy="9" r="9" stroke="none" />
          <Circle cx="9" cy="9" r="7.5" />
        </G>
        <G
          stroke={theme.successDecorative}
          strokeWidth="3"
          opacity={themeType === THEME_TYPES.DARK ? '.44' : '.24'}
          transform="translate(39 49)"
        >
          <Circle cx="9" cy="9" r="9" stroke="none" />
          <Circle cx="9" cy="9" r="7.5" />
        </G>
        <G stroke="#ffc929" strokeWidth="2" opacity={themeType === THEME_TYPES.DARK ? '.6' : '.4'}>
          <Path d="M7 35v14" />
          <Path d="M14 42H0" />
        </G>
        <G stroke="#ffc929" strokeWidth="2" opacity={themeType === THEME_TYPES.DARK ? '.6' : '.4'}>
          <Path d="M48 242v18" />
          <Path d="M57 251H39" />
        </G>
        <G stroke="#ffc929" strokeWidth="2" opacity={themeType === THEME_TYPES.DARK ? '.6' : '.4'}>
          <Path d="M443.5 166v14" />
          <Path d="M450.5 173h-14" />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(BackgroundShapes)
