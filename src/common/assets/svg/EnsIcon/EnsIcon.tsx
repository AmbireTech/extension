import React from 'react'
import Svg, { G, Path } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { LegendsSvgProps } from '@legends/types/svg'

interface Props extends LegendsSvgProps {
  isActive?: boolean
}

const EnsIcon: React.FC<Props> = ({ width = 24, height = 24, isActive, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest}>
      <G transform="translate(-1641 -298)">
        <G transform="translate(1642.2 298)" opacity={isActive ? '1' : '0.25'}>
          <Path
            d="M6531.259,9923.334a2.887,2.887,0,0,0-.946,1.037h0a4.784,4.784,0,0,0-.044,4.046h0c.238.509.827,1.51.827,1.51l6.808-11.219Z"
            transform="translate(-6527.496 -9918.708)"
            fill={color || theme.iconPrimary}
            fillRule="evenodd"
          />
          <Path
            d="M5664.471,12700.953a7.542,7.542,0,0,0,2.974,5.486l7.351,5.109s-4.6-6.606-8.478-13.179a6.612,6.612,0,0,1-.78-2.242,3.582,3.582,0,0,1,0-1.076c-.1.188-.3.57-.3.57a8.7,8.7,0,0,0-.794,2.534A15.467,15.467,0,0,0,5664.471,12700.953Z"
            transform="translate(-5664.395 -12687.548)"
            fill={color || theme.iconPrimary}
          />
          <Path
            d="M9791.5,14658.737l6.645-4.622a2.877,2.877,0,0,0,.945-1.037h0a4.784,4.784,0,0,0,.045-4.05h0c-.237-.507-.826-1.51-.826-1.51Z"
            transform="translate(-9780.308 -14634.737)"
            fill={color || theme.iconPrimary}
            fillRule="evenodd"
          />
          <Path
            d="M9805.175,9929.355a7.548,7.548,0,0,0-2.974-5.488l-7.351-5.108s4.6,6.606,8.478,13.18a6.641,6.641,0,0,1,.776,2.24,3.5,3.5,0,0,1,0,1.077c.1-.187.3-.569.3-.569a8.7,8.7,0,0,0,.793-2.535A15.367,15.367,0,0,0,9805.175,9929.355Z"
            transform="translate(-9783.649 -9918.759)"
            fill={color || theme.iconPrimary}
          />
          <Path
            d="M5684.071,9931.927a6.63,6.63,0,0,1,.775,2.241h0a3.55,3.55,0,0,1,0,1.076h0c.1-.187.3-.569.3-.569h0a8.668,8.668,0,0,0,.794-2.535h0a15.4,15.4,0,0,0-.021-2.795h0l-.011,0a7.546,7.546,0,0,0-2.975-5.488h0l-7.338-5.111S5680.188,9925.354,5684.071,9931.927Zm-15.915-8.553a2.886,2.886,0,0,0-.946,1.036h0a4.788,4.788,0,0,0-.044,4.05h0c.231.508.827,1.51.827,1.51h0l6.809-11.222Zm-2.918,3.447a8.658,8.658,0,0,0-.794,2.535h0a15.456,15.456,0,0,0,.023,2.8h0a7.547,7.547,0,0,0,2.975,5.487h0l7.35,5.108s-4.6-6.605-8.477-13.179h0a6.638,6.638,0,0,1-.78-2.241h0a3.614,3.614,0,0,1,0-1.076h0C5665.435,9926.439,5665.238,9926.821,5665.238,9926.821Zm10.345,15.927,6.646-4.622a2.9,2.9,0,0,0,.946-1.038h0a4.784,4.784,0,0,0,.044-4.05h0l-.012,0c-.238-.506-.827-1.509-.827-1.509h0Z"
            transform="translate(-5664.392 -9918.748)"
            fill={color || theme.iconPrimary}
            fillRule="evenodd"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(EnsIcon)
