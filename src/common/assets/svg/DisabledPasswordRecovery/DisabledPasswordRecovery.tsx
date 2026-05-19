import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

const DisabledPasswordRecovery: React.FC<SvgProps> = ({
  width = 64,
  height = 64,
  color,
  ...rest
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...rest}>
      <Path
        d="M8.3632 16.8487L4.72665 16.8487L4.72665 20.4852"
        stroke="#96A1B1"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M20.2791 14.2183C19.87 15.7452 19.0466 17.1292 17.8999 18.2174C16.7533 19.3055 15.3281 20.0553 13.7819 20.384C12.2357 20.7126 10.6287 20.6073 9.13859 20.0796C7.6485 19.552 6.33335 18.6225 5.33855 17.394"
        stroke="#96A1B1"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M15.6368 7.15133L19.2734 7.15133L19.2734 3.51478"
        stroke="#96A1B1"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M3.72087 9.78168C4.13 8.25478 4.95341 6.87077 6.10005 5.78264C7.24669 4.69452 8.67191 3.94468 10.2181 3.61602C11.7643 3.28736 13.3713 3.39269 14.8614 3.92036C16.3515 4.44803 17.6666 5.37748 18.6615 6.60596"
        stroke="#96A1B1"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path d="M17 14.375H7" stroke="#96A1B1" strokeLinecap="round" />
      <Path
        d="M12 10L12.179 10.6274L12.8119 10.4688L12.3581 10.9375L12.8119 11.4062L12.179 11.2476L12 11.875L11.821 11.2476L11.1881 11.4062L11.6419 10.9375L11.1881 10.4688L11.821 10.6274L12 10Z"
        stroke="#96A1B1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.9375 10L8.11655 10.6274L8.7494 10.4688L8.29559 10.9375L8.7494 11.4062L8.11655 11.2476L7.9375 11.875L7.75845 11.2476L7.1256 11.4062L7.57941 10.9375L7.1256 10.4688L7.75845 10.6274L7.9375 10Z"
        stroke="#96A1B1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.0625 10L16.2415 10.6274L16.8744 10.4688L16.4206 10.9375L16.8744 11.4062L16.2415 11.2476L16.0625 11.875L15.8835 11.2476L15.2506 11.4062L15.7044 10.9375L15.2506 10.4688L15.8835 10.6274L16.0625 10Z"
        stroke="#96A1B1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={19} cy={5} r={5} fill="#FF7089" />
      <Circle
        cx={3}
        cy={3}
        r={3}
        transform="matrix(-1 0 0 1 22 2)"
        stroke="white"
        strokeLinecap="round"
      />
      <Path d="M17 7L21.2426 2.75736" stroke="white" />
    </Svg>
  )
}

export default React.memo(DisabledPasswordRecovery)
