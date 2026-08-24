import React, { FC, memo } from 'react'
import Svg, { Circle, Line, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const SyncDevicesIcon: FC<SvgProps> = ({ width = 147, height = 87, ...rest }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height} viewBox="0 0 147 87" fill="none" {...rest}>
      <Path
        d="M0.5 23H50.5V82C50.5 84.2091 48.7091 86 46.5 86H4.5C2.29086 86 0.5 84.2091 0.5 82V23Z"
        fill={theme.primaryBackground}
        stroke={theme.neutral600}
      />
      <Path
        d="M0.5 23H50.5V20C50.5 18.3431 49.1569 17 47.5 17H3.5C1.84315 17 0.5 18.3431 0.5 20V23Z"
        fill={theme.primaryBackground}
        stroke={theme.neutral600}
      />
      <Rect
        x="2.5"
        y="25"
        width="46"
        height="25"
        rx="2"
        fill={theme.secondaryBackground}
        stroke={theme.neutral600}
      />
      <Rect x="14" y="42.5" width="5" height="4" rx="1.5" stroke={theme.neutral600} />
      <Rect x="21" y="42.5" width="9" height="4" rx="1.5" stroke={theme.neutral600} />
      <Rect x="32" y="42.5" width="5" height="4" rx="1.5" stroke={theme.neutral600} />
      <Circle cx="3.5" cy="20" r="1" fill={theme.neutral600} />
      <Circle cx="6.5" cy="20" r="1" fill={theme.neutral600} />
      <Circle cx="9.5" cy="20" r="1" fill={theme.neutral600} />
      <Rect
        x="110.5"
        y="17"
        width="36"
        height="69"
        rx="6"
        fill={theme.primaryBackground}
        stroke={theme.neutral600}
      />
      <Rect x="115.5" y="42" width="27" height="3" rx="1.5" fill={theme.secondaryBackground} />
      <Rect x="115.5" y="47" width="27" height="3" rx="1.5" fill={theme.secondaryBackground} />
      <Rect x="115.5" y="52" width="27" height="3" rx="1.5" fill={theme.secondaryBackground} />
      <Rect
        x="112.5"
        y="19"
        width="32"
        height="18"
        rx="4"
        fill={theme.secondaryBackground}
        stroke={theme.neutral600}
      />
      <Rect x="117" y="29.5" width="5" height="4" rx="1.5" stroke={theme.neutral600} />
      <Rect x="124" y="29.5" width="9" height="4" rx="1.5" stroke={theme.neutral600} />
      <Rect x="135" y="29.5" width="5" height="4" rx="1.5" stroke={theme.neutral600} />
      <Rect x="5.5" y="56" width="38" height="5" rx="2.5" fill={theme.secondaryBackground} />
      <Rect x="5.5" y="63" width="38" height="5" rx="2.5" fill={theme.secondaryBackground} />
      <Rect x="5.5" y="70" width="38" height="5" rx="2.5" fill={theme.secondaryBackground} />
      <Path
        d="M128.5 26C131.071 26 133.585 25.2376 135.722 23.8091C137.86 22.3806 139.526 20.3503 140.51 17.9749C141.494 15.5994 141.752 12.9856 141.25 10.4638C140.749 7.94208 139.51 5.6257 137.692 3.80762C135.874 1.98954 133.558 0.751405 131.036 0.249797C128.514 -0.251811 125.901 0.00563269 123.525 0.989572C121.15 1.97351 119.119 3.63975 117.691 5.77759C116.262 7.91543 115.5 10.4288 115.5 13C115.51 16.4448 116.883 19.7456 119.319 22.1814C121.754 24.6172 125.055 25.9901 128.5 26Z"
        fill={theme.primaryBackground}
      />
      <Path
        d="M128.5 22C130.28 22 132.02 21.4722 133.5 20.4832C134.98 19.4943 136.134 18.0887 136.815 16.4442C137.496 14.7996 137.674 12.99 137.327 11.2442C136.98 9.49836 136.123 7.89472 134.864 6.63604C133.605 5.37737 132.002 4.5202 130.256 4.17294C128.51 3.82567 126.7 4.0039 125.056 4.68509C123.411 5.36628 122.006 6.51983 121.017 7.99987C120.028 9.47991 119.5 11.22 119.5 13C119.507 15.3848 120.457 17.67 122.144 19.3564C123.83 21.0427 126.115 21.9931 128.5 22Z"
        stroke={theme.neutral600}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M124.25 12.9999L127.08 15.8299L132.75 10.1699"
        stroke={theme.neutral600}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="123" y1="80.5" x2="134" y2="80.5" stroke={theme.neutral600} strokeLinecap="round" />
      <Rect x="68.5" y="41" width="24" height="24" rx="12" fill={theme.secondaryBackground} />
      <Path
        d="M76.5 54L73.5 51L70.5 54"
        stroke={theme.neutral600}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M84 59.0622C82.882 59.7077 81.6073 60.0314 80.3168 59.9976C79.0262 59.9638 77.7702 59.5738 76.6875 58.8707C75.6048 58.1676 74.7377 57.1788 74.1819 56.0136C73.6261 54.8484 73.4034 53.5522 73.5383 52.2683"
        stroke={theme.neutral600}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M84.5 52L87.5 55L90.5 52"
        stroke={theme.neutral600}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M77 46.9378C78.118 46.2923 79.3927 45.9686 80.6832 46.0024C81.9738 46.0362 83.2298 46.4262 84.3125 47.1293C85.3952 47.8324 86.2623 48.8212 86.8181 49.9864C87.3739 51.1516 87.5966 52.4478 87.4617 53.7317"
        stroke={theme.neutral600}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Circle cx="25.5" cy="13" r="13" fill={theme.primaryBackground} />
      <Path
        d="M24.9004 3.5C25.7226 3.5001 26.3843 3.80214 26.8125 4.26465C27.2386 4.72489 27.4615 5.3734 27.3574 6.13184L27.2793 6.7002H31.7998V11.2207L32.3682 11.1426C33.1266 11.0385 33.7751 11.2614 34.2354 11.6875C34.6979 12.1157 34.9999 12.7774 35 13.5996C35 14.422 34.698 15.0844 34.2354 15.5127C33.7751 15.9387 33.1266 16.1617 32.3682 16.0576L31.7998 15.9795V20.5H27.0947L27.1768 19.9287C27.192 19.8217 27.2002 19.7117 27.2002 19.5996C27.2 18.3297 26.1703 17.3 24.9004 17.2998C23.6303 17.2998 22.5998 18.3296 22.5996 19.5996C22.5996 19.7115 22.6078 19.8216 22.623 19.9287L22.7051 20.5H18V15.7939L18.5703 15.877C18.6774 15.8923 18.7882 15.9004 18.9004 15.9004C20.1705 15.9002 21.2002 14.8697 21.2002 13.5996C21.2 12.3297 20.1703 11.3 18.9004 11.2998C18.7882 11.2998 18.6774 11.3079 18.5703 11.3232L18 11.4043V6.7002H22.5205L22.4424 6.13184C22.3383 5.37343 22.5613 4.72489 22.9873 4.26465C23.4156 3.80202 24.078 3.5 24.9004 3.5Z"
        stroke={theme.neutral600}
      />
      <Line
        x1="53"
        y1="48.5"
        x2="66"
        y2="48.5"
        stroke={theme.neutral600}
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
      <Path
        d="M52.6464 58.1464C52.4512 58.3417 52.4512 58.6583 52.6464 58.8536L55.8284 62.0355C56.0237 62.2308 56.3403 62.2308 56.5355 62.0355C56.7308 61.8403 56.7308 61.5237 56.5355 61.3284L53.7071 58.5L56.5355 55.6716C56.7308 55.4763 56.7308 55.1597 56.5355 54.9645C56.3403 54.7692 56.0237 54.7692 55.8284 54.9645L52.6464 58.1464ZM66 59H66.5V58H66V58.5V59ZM54.0833 59H54.5833V58H54.0833V58.5V59ZM56.25 58H55.75V59H56.25V58.5V58ZM58.4167 59H58.9167V58H58.4167V58.5V59ZM60.5833 58H60.0833V59H60.5833V58.5V58ZM62.75 59H63.25V58H62.75V58.5V59ZM64.9167 58H64.4167V59H64.9167V58.5V58ZM53 58.5V59H54.0833V58.5V58H53V58.5ZM56.25 58.5V59H58.4167V58.5V58H56.25V58.5ZM60.5833 58.5V59H62.75V58.5V58H60.5833V58.5ZM64.9167 58.5V59H66V58.5V58H64.9167V58.5Z"
        fill={theme.neutral600}
      />
      <Path
        d="M95 48L94.5 48L94.5 49L95 49L95 48.5L95 48ZM108.354 48.8536C108.549 48.6583 108.549 48.3417 108.354 48.1464L105.172 44.9645C104.976 44.7692 104.66 44.7692 104.464 44.9645C104.269 45.1597 104.269 45.4763 104.464 45.6716L107.293 48.5L104.464 51.3284C104.269 51.5237 104.269 51.8403 104.464 52.0355C104.66 52.2308 104.976 52.2308 105.172 52.0355L108.354 48.8536ZM96.0833 49L96.5833 49L96.5833 48L96.0833 48L96.0833 48.5L96.0833 49ZM98.25 48L97.75 48L97.75 49L98.25 49L98.25 48.5L98.25 48ZM100.417 49L100.917 49L100.917 48L100.417 48L100.417 48.5L100.417 49ZM102.583 48L102.083 48L102.083 49L102.583 49L102.583 48.5L102.583 48ZM104.75 49L105.25 49L105.25 48L104.75 48L104.75 48.5L104.75 49ZM106.917 48L106.417 48L106.417 49L106.917 49L106.917 48.5L106.917 48ZM95 48.5L95 49L96.0833 49L96.0833 48.5L96.0833 48L95 48L95 48.5ZM98.25 48.5L98.25 49L100.417 49L100.417 48.5L100.417 48L98.25 48L98.25 48.5ZM102.583 48.5L102.583 49L104.75 49L104.75 48.5L104.75 48L102.583 48L102.583 48.5ZM106.917 48.5L106.917 49L108 49L108 48.5L108 48L106.917 48L106.917 48.5Z"
        fill={theme.neutral600}
      />
      <Line
        x1="95"
        y1="58.5"
        x2="108"
        y2="58.5"
        stroke={theme.neutral600}
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
    </Svg>
  )
}

export default memo(SyncDevicesIcon)
