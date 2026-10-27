import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

/** The round Privacy Pools logo, shown in the Privacy Pools badge. */
const PrivacyPoolsLogoIcon: React.FC<SvgProps> = ({ width = 16, height = 16, color, ...rest }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...rest}>
      <Path
        fill={color || theme.privacyPoolsText}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM8.7549 11.8431H12.8354C13.6616 10.805 14.1605 9.49484 14.1761 8.06863H8.7549V11.8431ZM4.5915 11.8431H7.97712V8.06863H4.5915V11.8431ZM8 1.82353C4.58883 1.82353 1.82353 4.58883 1.82353 8C1.82353 9.45279 2.32519 10.7884 3.16462 11.8431H3.81373V5.46078C3.81373 4.39953 4.67404 3.53922 5.73529 3.53922C6.79655 3.53922 7.65686 4.39953 7.65686 5.46078V7.29085H7.97712V5.46078C7.97712 4.39953 8.83744 3.53922 9.89869 3.53922C10.9599 3.53922 11.8203 4.39953 11.8203 5.46078V7.29085H14.1362C13.7845 4.21367 11.1713 1.82353 8 1.82353ZM5.73529 4.31699C5.1036 4.31699 4.5915 4.82909 4.5915 5.46078V7.29085H6.87909V5.46078C6.87909 4.82909 6.36699 4.31699 5.73529 4.31699ZM9.89869 4.31699C9.26699 4.31699 8.7549 4.82909 8.7549 5.46078V7.29085H11.0425V5.46078C11.0425 4.82909 10.5304 4.31699 9.89869 4.31699Z"
      />
    </Svg>
  )
}

export default React.memo(PrivacyPoolsLogoIcon)
