import { FC, memo } from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

import type { ColorValue } from 'react-native'
interface Props extends SvgProps {
  color?: ColorValue
}

const SyncIcon: FC<Props> = ({ width = 24, height = 24, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M8 13L5 10L2 13"
        stroke={color || theme.primaryText}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M15.5 18.0622C14.382 18.7077 13.1073 19.0314 11.8168 18.9976C10.5262 18.9638 9.27021 18.5738 8.18753 17.8707C7.10484 17.1676 6.23767 16.1788 5.6819 15.0136C5.12613 13.8484 4.9034 12.5522 5.03835 11.2683"
        stroke={color || theme.primaryText}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M16 11L19 14L22 11"
        stroke={color || theme.primaryText}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M8.5 5.93782C9.618 5.29234 10.8927 4.96861 12.1832 5.0024C13.4738 5.03619 14.7298 5.4262 15.8125 6.12931C16.8952 6.83241 17.7623 7.82122 18.3181 8.98642C18.8739 10.1516 19.0966 11.4478 18.9617 12.7317"
        stroke={color || theme.primaryText}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default memo(SyncIcon)
