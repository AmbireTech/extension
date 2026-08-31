import { FC, memo } from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const ShieldInvisibilityIcon: FC<SvgProps> = ({ width = 44, height = 50, color, ...rest }) => {
  const { theme } = useTheme()
  const strokeColor = color || theme.iconPrimary

  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 44 50" {...rest}>
      <Path
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M42.7264 22.631C42.5837 28.5454 40.5851 34.2575 37.0239 38.9291C33.4628 43.6007 28.5266 46.9859 22.9396 48.5879C22.1527 48.804 21.3237 48.804 20.5369 48.5879C14.9499 46.9859 10.0137 43.6007 6.4525 38.9291C2.89135 34.2575 0.892762 28.5454 0.75 22.631V12.0897C0.800944 11.0391 1.13299 10.0228 1.71016 9.15085C2.28734 8.27891 3.08761 7.58463 4.02426 7.14325L17.1448 1.66853C20.0974 0.443825 23.4026 0.443825 26.3552 1.66853L39.4757 7.14325C40.4091 7.58914 41.2064 8.28457 41.783 9.15556C42.3595 10.0266 42.6937 11.0406 42.75 12.0897L42.7264 22.631Z"
      />
      <Path
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.35 24.45C12.6 19.9 16.9 17.8 21.75 17.8C26.6 17.8 30.9 19.9 34.15 24.45C30.9 29 26.6 31.1 21.75 31.1C16.9 31.1 12.6 29 9.35 24.45Z"
      />
      <Circle cx={21.75} cy={24.45} r={3.9} stroke={strokeColor} strokeWidth={1.5} />
      <Path
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        d="M13.7 14.05 31.8 33.6"
      />
    </Svg>
  )
}

export default memo(ShieldInvisibilityIcon)
