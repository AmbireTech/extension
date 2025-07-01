import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ImportAccountsFromSeedPhraseIcon: React.FC<SvgProps> = ({
  width = 43,
  height = 53,
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 43.285 53" {...rest}>
      <G transform="translate(14222.643 19072)">
        <G transform="translate(-14249 -19092)">
          <G transform="translate(27.357 23.999)">
            <Path
              d="M14242.284,19120a10.286,10.286,0,0,1-6.169-1.908l-10.321-7.707a11.632,11.632,0,0,1-4.151-8.258v-17.832a8.3,8.3,0,0,1,5.015-7.227l7.425-2.795a8.888,8.888,0,0,0-.347.891,9.143,9.143,0,0,0-.451,2.836,8.783,8.783,0,0,0,1.306,4.635,8.315,8.315,0,0,0,1.708,2.049,8.867,8.867,0,0,0,5.988,2.318,8.284,8.284,0,0,0,2.813-.475,8.732,8.732,0,0,0,4.88-3.893,8.349,8.349,0,0,0,1.037-2.543,8.224,8.224,0,0,0,.269-2.092,8.852,8.852,0,0,0-.824-3.744l7.451,2.793a8.3,8.3,0,0,1,5.015,7.246v17.832a11.632,11.632,0,0,1-4.151,8.258l-10.321,7.707A10.286,10.286,0,0,1,14242.284,19120Z"
              transform="translate(-14221.643 -19072)"
              fill="none"
              stroke={color || theme.iconPrimary}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <Path
              d="M6.092.3A.6.6,0,0,1,7.164.84L6.5,2.409A.6.6,0,0,0,7,3.242l2.263.177a.6.6,0,0,1,0,1.2L7,4.793a.6.6,0,0,0-.506.834L7.164,7.2a.6.6,0,0,1-1.072.537L5.43,6.592a.6.6,0,0,0-1.039,0L3.729,7.732A.6.6,0,0,1,2.657,7.2l.666-1.568a.6.6,0,0,0-.506-.834L.554,4.617a.6.6,0,0,1,0-1.2l2.263-.177a.6.6,0,0,0,.506-.834L2.657.84A.6.6,0,0,1,3.729.3l.663,1.139a.6.6,0,0,0,1.039,0Z"
              transform="translate(12.86 21.076) rotate(90)"
              fill={color || theme.iconPrimary}
            />
            <Path
              d="M6.092.3A.6.6,0,0,1,7.164.84L6.5,2.409A.6.6,0,0,0,7,3.242l2.263.177a.6.6,0,0,1,0,1.2L7,4.793a.6.6,0,0,0-.506.834L7.164,7.2a.6.6,0,0,1-1.072.537L5.43,6.592a.6.6,0,0,0-1.039,0L3.729,7.732A.6.6,0,0,1,2.657,7.2l.666-1.568a.6.6,0,0,0-.506-.834L.554,4.617a.6.6,0,0,1,0-1.2l2.263-.177a.6.6,0,0,0,.506-.834L2.657.84A.6.6,0,0,1,3.729.3l.663,1.139a.6.6,0,0,0,1.039,0Z"
              transform="translate(24.661 21.076) rotate(90)"
              fill={color || theme.iconPrimary}
            />
            <Path
              d="M6.092.3A.6.6,0,0,1,7.164.84L6.5,2.409A.6.6,0,0,0,7,3.242l2.263.177a.6.6,0,0,1,0,1.2L7,4.793a.6.6,0,0,0-.506.834L7.164,7.2a.6.6,0,0,1-1.072.537L5.43,6.592a.6.6,0,0,0-1.039,0L3.729,7.732A.6.6,0,0,1,2.657,7.2l.666-1.568a.6.6,0,0,0-.506-.834L.554,4.617a.6.6,0,0,1,0-1.2l2.263-.177a.6.6,0,0,0,.506-.834L2.657.84A.6.6,0,0,1,3.729.3l.663,1.139a.6.6,0,0,0,1.039,0Z"
              transform="translate(36.462 21.076) rotate(90)"
              fill={color || theme.iconPrimary}
            />
          </G>
          <G transform="translate(14138 19087)">
            <Path
              d="M11.314,13.434a2.662,2.662,0,1,0-2.662-2.662A2.662,2.662,0,0,0,11.314,13.434Z"
              transform="translate(-14101.352 -19069.27)"
              fill="none"
              stroke={color || theme.iconPrimary}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <Path
              d="M16.105,19.977c0-2.207-2.2-4.007-4.917-4.007S6.271,17.76,6.271,19.977"
              transform="translate(-14101.227 -19069.682)"
              fill="none"
              stroke={color || theme.iconPrimary}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <Path
              d="M33,10a8.086,8.086,0,0,1-.27,2.092A8.4,8.4,0,0,1,31.7,14.635a8.771,8.771,0,0,1-4.882,3.892A8.293,8.293,0,0,1,24,19a8.822,8.822,0,0,1-5.985-2.318,8.288,8.288,0,0,1-1.71-2.047A8.822,8.822,0,0,1,15,10a9.121,9.121,0,0,1,.45-2.835,8.876,8.876,0,0,1,2.093-3.442A8.988,8.988,0,0,1,24,1a8.874,8.874,0,0,1,6.683,2.993A8.964,8.964,0,0,1,33,10Z"
              transform="translate(-14114.002 -19067)"
              fill="none"
              stroke={color || theme.iconPrimary}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(ImportAccountsFromSeedPhraseIcon)
