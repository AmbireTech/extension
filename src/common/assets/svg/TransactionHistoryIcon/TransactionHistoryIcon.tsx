import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const TransactionHistoryIcon: React.FC<SvgProps> = ({
  width = 24,
  height = 24,
  color,
  ...rest
}) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" {...rest} fill="none">
      <Path
        d="M13 8L10 5L13 2"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M4.28549 9.15934C3.66868 10.1859 3.26296 11.3252 3.09208 12.5106C2.92121 13.6959 2.98862 14.9034 3.29038 16.0624C3.59214 17.2214 4.12217 18.3084 4.84941 19.2599C5.57665 20.2114 6.48649 21.0082 7.5256 21.6036"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      <Path
        d="M7.23073 21.4271C8.44189 22.1839 9.81578 22.6416 11.2388 22.7624C12.6619 22.8832 14.0933 22.6636 15.4147 22.1217C16.7361 21.5799 17.9095 20.7313 18.8381 19.6462C19.7667 18.5611 20.4236 17.2706 20.7548 15.8813C21.0859 14.4921 21.0816 13.0439 20.7424 11.6567C20.4031 10.2694 19.7385 8.98272 18.8036 7.90308C17.8687 6.82344 16.6903 5.98179 15.3657 5.4477C14.0412 4.91361 12.6085 4.70241 11.1862 4.83155"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M16.5 14.5H12.25C12.1119 14.5 12 14.3881 12 14.25V11"
        stroke={color || theme.iconPrimary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default React.memo(TransactionHistoryIcon)
