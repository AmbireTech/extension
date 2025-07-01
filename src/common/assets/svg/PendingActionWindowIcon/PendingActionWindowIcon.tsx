import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const PendingActionWindowIcon: React.FC<SvgProps> = ({
  width = 36,
  height = 36,
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 33.5 33.5" {...rest}>
      <G transform="translate(-23425.25 -6779.25)">
        <G transform="translate(23426 6787.385)">
          <Path
            d="M4.465,2H25.523C29.9,2,31,3.1,31,7.465v7.791c0,4.382-1.1,5.465-5.465,5.465H4.465C.1,20.732-1,19.637-1,15.268v-7.8C-1,3.1.1,2,4.465,2Z"
            transform="translate(1 -2)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            d="M12,17.22V23.1"
            transform="translate(4 1.512)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <Path
            d="M7.5,22H22.269"
            transform="translate(1.115 2.615)"
            fill="none"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </G>
        <G transform="translate(23432.154 6780)">
          <Path
            d="M5.169,15.769h9.354c3.692,0,5.169-1.477,5.169-5.169V6.169C19.692,2.477,18.215,1,14.523,1H5.169C1.477,1,0,2.477,0,6.169V10.6C0,14.292,1.477,15.769,5.169,15.769Z"
            transform="translate(0 -1)"
            fill="#fff"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </G>
        <G
          transform="translate(23429.078 6780.463)"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path
            d="M16.923,3.846A.923.923,0,1,0,16,2.923.923.923,0,0,0,16.923,3.846Z"
            stroke="none"
          />
          <Path
            d="M 16.92307662963867 3.846157789230347 C 16.41325569152832 3.846157789230347 15.99999618530273 3.432877779006958 15.99999618530273 2.923077821731567 C 15.99999618530273 2.413277864456177 16.41325569152832 1.999997854232788 16.92307662963867 1.999997854232788 C 17.43289756774902 1.999997854232788 17.84615707397461 2.413277864456177 17.84615707397461 2.923077821731567 C 17.84615707397461 3.432877779006958 17.43289756774902 3.846157789230347 16.92307662963867 3.846157789230347 Z"
            stroke="none"
            fill={color || theme.iconPrimary}
          />
        </G>
        <G
          transform="translate(23426.615 6780.463)"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path
            d="M16.923,3.846A.923.923,0,1,0,16,2.923.923.923,0,0,0,16.923,3.846Z"
            stroke="none"
          />
          <Path
            d="M 16.92307662963867 3.846157789230347 C 16.41325569152832 3.846157789230347 15.99999618530273 3.432877779006958 15.99999618530273 2.923077821731567 C 15.99999618530273 2.413277864456177 16.41325569152832 1.999997854232788 16.92307662963867 1.999997854232788 C 17.43289756774902 1.999997854232788 17.84615707397461 2.413277864456177 17.84615707397461 2.923077821731567 C 17.84615707397461 3.432877779006958 17.43289756774902 3.846157789230347 16.92307662963867 3.846157789230347 Z"
            stroke="none"
            fill={color || theme.iconPrimary}
          />
        </G>
        <G
          transform="translate(23431.539 6780.463)"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path
            d="M16.923,3.846A.923.923,0,1,0,16,2.923.923.923,0,0,0,16.923,3.846Z"
            stroke="none"
          />
          <Path
            d="M 16.92307662963867 3.846157789230347 C 16.41325569152832 3.846157789230347 15.99999618530273 3.432877779006958 15.99999618530273 2.923077821731567 C 15.99999618530273 2.413277864456177 16.41325569152832 1.999997854232788 16.92307662963867 1.999997854232788 C 17.43289756774902 1.999997854232788 17.84615707397461 2.413277864456177 17.84615707397461 2.923077821731567 C 17.84615707397461 3.432877779006958 17.43289756774902 3.846157789230347 16.92307662963867 3.846157789230347 Z"
            stroke="none"
            fill={color || theme.iconPrimary}
          />
        </G>
        <Path
          d="M2,13H34"
          transform="translate(23424 6788.333)"
          fill="none"
          stroke={color || theme.iconPrimary}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </G>
    </Svg>
  )
}

export default React.memo(PendingActionWindowIcon)
