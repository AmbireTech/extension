import React, { FC } from 'react'
import { Path, Svg, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const CheckIcon2: FC<SvgProps> = ({ width = 64, height = 64, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" {...rest}>
      <Path
        fill={theme.successDecorative}
        d="m18.88 25.925-4.48 4.48 14.4 14.4 32-32-4.475-4.48L28.8 35.68Zm38.72 6.08a25.491 25.491 0 1 1-18.559-24.64L44 2.405a29.766 29.766 0 0 0-12-2.4 32 32 0 1 0 32 32Z"
      />
    </Svg>
  )
}

export default React.memo(CheckIcon2)
