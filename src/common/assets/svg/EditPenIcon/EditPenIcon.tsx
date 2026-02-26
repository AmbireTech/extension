import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const EditPenIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 20 20" fill="none">
      <Path
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        d="M12.183 4.693c.21-.038.425-.038.634 0 .327.06.582.223.795.396.203.164.425.388.668.63.243.244.468.466.632.669.173.213.334.468.395.795.038.21.038.425 0 .634-.06.327-.222.582-.395.795-.164.203-.389.425-.632.668L8.423 15.14c-.167.166-.344.352-.571.481-.228.129-.479.185-.707.242l-1.988.496c-.156.04-.356.092-.527.109-.18.018-.537.019-.826-.27-.29-.289-.288-.646-.27-.827.016-.171.069-.371.108-.527l.497-1.988c.057-.228.113-.478.242-.706.129-.227.314-.404.48-.57l5.859-5.86c.242-.242.465-.466.668-.63.213-.173.468-.335.795-.396Z"
      />
      <Path
        fill={color || theme.iconPrimary}
        d="m10.417 6.25 2.5-1.667 2.5 2.5-1.667 2.5-3.333-3.333Z"
      />
    </Svg>
  )
}

export default React.memo(EditPenIcon)
