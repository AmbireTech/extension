import React from 'react'
import Svg, { Circle, Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

interface Props extends SvgProps {
  hasError?: boolean
}

const GasTankIcon: React.FC<Props> = ({
  width = 21,
  height = 20,
  color,
  hasError = false,
  ...rest
}) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox="0 0 21 20" fill="none" {...rest}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 0C11.6569 0 13 1.34315 13 3V12.583H15.335C16.0252 12.5828 16.585 12.0232 16.585 11.333V8.66699H16.0547C15.3483 8.66699 14.7755 8.09407 14.7754 7.3877V6.15723C14.7754 5.71028 14.9442 5.27989 15.248 4.95215L15.8867 4.2627L13.876 2.57422C13.5591 2.30781 13.518 1.83466 13.7842 1.51758C14.0505 1.20052 14.5237 1.15956 14.8408 1.42578L17.1035 3.32617C17.7255 3.84861 18.0849 4.6194 18.085 5.43164V11.333C18.085 12.8517 16.8536 14.0828 15.335 14.083H13V17L13.1025 17.0049C13.6067 17.0562 14 17.4823 14 18V19C14 19.5523 13.5523 20 13 20H1C0.447715 20 1.61065e-08 19.5523 0 19V18C0 17.4477 0.447715 17 1 17V3C1 1.34315 2.34315 0 4 0H10ZM4 2C3.44772 2 3 2.44772 3 3V7C3 7.55228 3.44772 8 4 8H10C10.5523 8 11 7.55228 11 7V3C11 2.44772 10.5523 2 10 2H4Z"
        fill={color || theme.iconPrimary}
      />
      {hasError && (
        <>
          <Circle cx="15" cy="14" r="6" fill="#FF7089" />
          <Circle
            cx="3.6"
            cy="3.6"
            r="3.6"
            transform="matrix(-1 0 0 1 18.6001 10.4)"
            stroke={color || theme.iconPrimary}
            strokeLinecap="round"
          />
          <Path d="M12.6001 16.4L17.6913 11.3089" stroke={color || theme.iconPrimary} />
        </>
      )}
    </Svg>
  )
}

export default React.memo(GasTankIcon)
