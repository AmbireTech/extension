import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { iconColors } from '@common/styles/themeConfig'

const DiscordIcon: React.FC<SvgProps> = ({
  width = 32,
  height = 32,
  color = iconColors.primary,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 32 32" {...rest}>
      <G transform="translate(-104 -459)">
        <Rect
          width="32"
          height="32"
          rx="6"
          transform="translate(104 459)"
          fill={theme.secondaryBackground}
        />
        <Path
          d="M114.577 482.12a7.432 7.432 0 0 1-4.3-1.416 5.163 5.163 0 0 1-1.273-1.321 23.987 23.987 0 0 1 2.633-10.494 9.2 9.2 0 0 1 5.118-1.89h.021l.183.216a12.559 12.559 0 0 0-4.806 2.356l.04-.021c.122-.062.492-.252 1.037-.5a16.1 16.1 0 0 1 6.337-1.307 15.465 15.465 0 0 1 7.322 1.829 12.222 12.222 0 0 0-4.553-2.286l.256-.288h.021a9.193 9.193 0 0 1 5.117 1.89 23.807 23.807 0 0 1 2.634 10.494 5.235 5.235 0 0 1-1.282 1.321 7.475 7.475 0 0 1-4.312 1.415c-.007-.008-.66-.776-1.207-1.458a5.775 5.775 0 0 0 3.309-2.142 10.513 10.513 0 0 1-2.1 1.062 12.99 12.99 0 0 1-4.989.973 13.5 13.5 0 0 1-6.421-1.6l-.075-.043h-.007c-.15-.085-.46-.26-.667-.4a5.762 5.762 0 0 0 3.2 2.124c-.54.674-1.22 1.488-1.225 1.494Zm8.357-8.406a1.937 1.937 0 0 0-1.865 2 1.937 1.937 0 0 0 1.865 2 1.937 1.937 0 0 0 1.866-2 1.937 1.937 0 0 0-1.866-2.002Zm-6.675 0a1.937 1.937 0 0 0-1.865 2 1.937 1.937 0 0 0 1.865 2 1.937 1.937 0 0 0 1.866-2 2.023 2.023 0 0 0-.57-1.447 1.808 1.808 0 0 0-1.296-.555Z"
          fill={color}
        />
      </G>
    </Svg>
  )
}

export default DiscordIcon
