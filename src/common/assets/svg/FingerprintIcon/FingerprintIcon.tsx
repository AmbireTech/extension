import React from 'react'
import Svg, { ClipPath, Defs, G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const FingerprintIcon: React.FC<SvgProps> = ({ width = 64, height = 64, color, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none" {...rest}>
      <G clipPath="url(#clip0_3164_77470)">
        <Path
          d="M13.5996 18.6665C11.1877 22.6697 10.1572 27.3541 10.6663 31.9998V34.6665C10.6694 37.4742 9.93365 40.2332 8.53294 42.6665"
          stroke={color || theme.iconPrimary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M42.666 29.3332C42.666 26.5042 41.5422 23.7911 39.5418 21.7907C37.5414 19.7903 34.8283 18.6665 31.9993 18.6665C29.1704 18.6665 26.4573 19.7903 24.4569 21.7907C22.4565 23.7911 21.3327 26.5042 21.3327 29.3332V31.9998C21.3327 37.7697 19.4613 43.3839 15.9994 47.9998"
          stroke={color || theme.iconPrimary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M32 29.333V34.6663C32.0085 42.2914 29.682 49.7362 25.3333 55.9997"
          stroke={color || theme.iconPrimary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M42.666 40C42.0135 45.5729 40.3889 50.9882 37.866 56"
          stroke={color || theme.iconPrimary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M50.9329 50.6662C52.7322 44.6137 53.5426 38.3104 53.3329 31.9996V29.3329C53.3431 25.5832 52.3648 21.897 50.4966 18.6459C48.6284 15.3947 45.9362 12.6933 42.6914 10.8141C39.4466 8.93479 35.7638 7.94396 32.0141 7.94141C28.2644 7.93887 24.5802 8.9247 21.3329 10.7996"
          stroke={color || theme.iconPrimary}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_3164_77470">
          <Rect width="64" height="64" rx="32" transform="matrix(-1 0 0 1 64 0)" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}

export default React.memo(FingerprintIcon)
