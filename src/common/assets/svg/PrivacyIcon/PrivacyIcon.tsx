import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PrivacyIcon: React.FC<SvgProps> = ({
  width = 26,
  height = 26,
  color,
  strokeWidth = 1.65
}) => {
  const { theme } = useTheme()
  const iconColor = color || theme.iconSecondary

  return (
    <Svg width={width} height={height} viewBox="0 0 26 26">
      <Path
        fill="none"
        stroke={iconColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.671 24.901a18.137 18.137 0 0 1-6.8-3.9 12.109 12.109 0 0 1-2.586-3.371 9.421 9.421 0 0 1-1.026-4.27V4.301c.5.041.81.066 1.3.066a14.2 14.2 0 0 0 4.312-.641A23.474 23.474 0 0 0 13 1a23.5 23.5 0 0 0 5.127 2.726 14.2 14.2 0 0 0 4.312.641c.493 0 .8-.024 1.3-.065v9.058a9.421 9.421 0 0 1-1.026 4.27 12.109 12.109 0 0 1-2.583 3.375 18.138 18.138 0 0 1-6.816 3.9l-.316.1Z"
      />
      <Path
        d="M13 10.014a2.918 2.918 0 0 1 2.813 3.817l1.808 1.808a6.974 6.974 0 0 0 1.879-2.676 7 7 0 0 0-8.651-4.089l1.282 1.282a3.037 3.037 0 0 1 .869-.142ZM7.51 8.04a.588.588 0 0 0 0 .833l1.165 1.165A7.027 7.027 0 0 0 6.5 12.969a6.972 6.972 0 0 0 9.047 3.947l1.607 1.607a.589.589 0 0 0 .833-.833L8.35 8.04a.6.6 0 0 0-.84 0ZM13 15.923a2.956 2.956 0 0 1-2.955-2.954 2.9 2.9 0 0 1 .29-1.269l.928.928a2.029 2.029 0 0 0-.035.337A1.77 1.77 0 0 0 13 14.741a1.592 1.592 0 0 0 .337-.041l.928.928a2.844 2.844 0 0 1-1.265.295Zm1.755-3.15a1.754 1.754 0 0 0-1.56-1.56Z"
        fill={iconColor}
        fillRule="evenodd"
      />
    </Svg>
  )
}

export default React.memo(PrivacyIcon)
