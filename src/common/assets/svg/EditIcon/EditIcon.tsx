import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const EditIcon: React.FC<Props> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24">
      <Path
        d="M5 22.001a3 3 0 0 1-3-3v-13a3 3 0 0 1 3-3h4.5a1 1 0 0 1 0 2H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-4.5a1 1 0 1 1 2 0v4.5a3 3 0 0 1-3 3Zm3.3-6.226c-.781-.781-.041-5.322.739-6.1l7.779-7.778a2 2 0 0 1 2.829 0l2.474 2.475a2 2 0 0 1 0 2.828l-7.778 7.779c-.555.554-2.978 1.12-4.614 1.12a2.228 2.228 0 0 1-1.429-.325Zm2.258-4.793a7.892 7.892 0 0 0-.471 1.86 10.021 10.021 0 0 0-.117 1.247 10.083 10.083 0 0 0 1.221-.133 7.936 7.936 0 0 0 1.835-.493l4.357-4.356-2.476-2.475Zm5.764-5.765 2.475 2.476 1.909-1.91-2.474-2.475Z"
        fill={color || theme.iconSecondary}
      />
    </Svg>
  )
}

export default React.memo(EditIcon)
