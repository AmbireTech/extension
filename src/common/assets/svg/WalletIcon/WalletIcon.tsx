import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const WalletIcon: React.FC<SvgProps> = ({ width = 24, height = 24, ...rest }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 18 18" fill="none" {...rest}>
      <Path
        stroke="#96A1B1"
        strokeWidth="1.5"
        d="M2.25 4.875v6.875c0 1.886 0 2.828.586 3.414.586.586 1.528.586 3.414.586h7.5c.943 0 1.414 0 1.707-.293.293-.293.293-.764.293-1.707v-1M2.25 4.875c0 1.036.84 1.875 1.875 1.875h9.625c.943 0 1.414 0 1.707.293.293.293.293.764.293 1.707v1M2.25 4.875C2.25 3.839 3.09 3 4.125 3h10.403a.5.5 0 0 1 .472.536c0 .199 0 .298-.005.382a3 3 0 0 1-2.827 2.827c-.084.005-.183.005-.382.005h-.536m4.5 6h-3c-.466 0-.699 0-.883-.076a1 1 0 0 1-.54-.541c-.077-.184-.077-.417-.077-.883s0-.699.076-.883a1 1 0 0 1 .541-.54c.184-.077.417-.077.883-.077h3m0 3v-3"
      />
    </Svg>
  )
}

export default React.memo(WalletIcon)
