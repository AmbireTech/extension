import React from 'react'
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const RewardBadgeLobster: React.FC<Props> = ({ width = 82.074, height = 93.633, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 82.074 93.633" {...rest}>
    <Defs>
      <LinearGradient
        id="b"
        x1={0.5}
        y1={0.049}
        x2={0.5}
        y2={0.959}
        gradientUnits="objectBoundingBox"
      >
        <Stop offset={0} stopColor="#3e436b" />
        <Stop offset={1} stopColor="#2d314d" />
      </LinearGradient>
    </Defs>
    <G transform="translate(8.137) translate(-8.14)" filter="url(#a)">
      <Path
        d="M405.2 417.165a32.041 32.041 0 01-32.037-32.037V360.32a9.368 9.368 0 016.228-8.816l23.055-7.668a8.732 8.732 0 015.508 0l23.072 7.673a9.363 9.363 0 016.211 8.811v24.809a32.041 32.041 0 01-32.037 32.036z"
        transform="translate(-364.16 -342.53)"
        fill="url(#b)"
      />
    </G>
    <Path
      d="M405.2 417.165a32.041 32.041 0 01-32.037-32.037V360.32a9.368 9.368 0 016.228-8.816l23.055-7.668a8.732 8.732 0 015.508 0l23.072 7.673a9.363 9.363 0 016.211 8.811v24.809a32.041 32.041 0 01-32.037 32.036z"
      transform="translate(8.137) translate(-372.297 -342.533)"
      fill="url(#b)"
    />
    <Path
      d="M404.55 343.6a8 8 0 012.485.4l23.055 7.668a8.508 8.508 0 015.639 8v24.809a31.18 31.18 0 11-62.359 0v-24.8a8.519 8.519 0 015.645-8L402.07 344a7.905 7.905 0 012.48-.4m0-1.714a9.631 9.631 0 00-3.028.491l-23.072 7.673a10.216 10.216 0 00-6.8 9.622v24.809a32.9 32.9 0 0014.77 27.454 32.885 32.885 0 0036.248 0 32.9 32.9 0 0014.77-27.454v-24.804a10.21 10.21 0 00-6.8-9.622l-23.072-7.673a9.534 9.534 0 00-3.017-.491z"
      transform="translate(8.137) translate(-371.6 -341.89)"
      fill="#6770b3"
    />
    <Path
      d="M3.75 0h1.58L3.49-2.78l1.82-2.76h-1.5L2.79-3.83 1.66-5.54H.08l1.83 2.76L.1 0h1.5l1.01-1.72zm2.98 0h1.44v-7.29H5.76V-6h.97zm4.45-.75a.818.818 0 00-.85-.82.824.824 0 00-.87.82.824.824 0 00.87.82.818.818 0 00.85-.82zm1.35-6.56v4.28h1.34a1.09 1.09 0 011.1-.77 1.108 1.108 0 011.2 1.27c0 .77-.37 1.35-1.19 1.35a1.14 1.14 0 01-1.21-.88h-1.36A2.323 2.323 0 0015 0a2.34 2.34 0 002.52-2.55 2.194 2.194 0 00-2.28-2.41 1.9 1.9 0 00-1.43.59v-1.71h3.24v-1.23z"
      transform="translate(8.137) translate(23.572 56.141) translate(.479 9.859)"
      fill="#ebecff"
    />
    <Path
      d="M419.158 425.326l2.605-2.137a1.75 1.75 0 012.463.246 1.107 1.107 0 01.1.131 1.5 1.5 0 01.28-.023 1.967 1.967 0 01.263.017c.029-.046.063-.086.1-.131a1.75 1.75 0 012.463-.246l2.605 2.137a1.75 1.75 0 01.246 2.463 1.726 1.726 0 01-.9.583 1.763 1.763 0 01-1.206 1.411 2.258 2.258 0 00-3.571.634 2.242 2.242 0 00-3.605-.634 1.737 1.737 0 01-1.206-1.417 1.692 1.692 0 01-.88-.577 1.749 1.749 0 01.243-2.457z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(10.148 28.229) translate(-418.516 -419.753)"
      fill="#fd1a64"
    />
    <Path
      d="M419.148 427.25a3.436 3.436 0 011.852 1.76 2.242 2.242 0 013.605.634 2.258 2.258 0 013.571-.634 1.4 1.4 0 112.108.691 1.726 1.726 0 01-.9.583 7.118 7.118 0 00-4.777 2.046 2.242 2.242 0 00-3.607-.63 1.736 1.736 0 01-1.206-1.417 1.692 1.692 0 01-.88-.577 1.74 1.74 0 01.234-2.456z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(10.148 28.229) translate(-418.517 -421.666)"
      fill="#bf1057"
    />
    <Path
      d="M422.628 423.449a9.2 9.2 0 003.125.36 10.626 10.626 0 003.354-.4c.663-.257 1.177-.526 1.177-1.177a1.174 1.174 0 00-1.04-1.166.684.684 0 00-.24.017 17.3 17.3 0 01-3.223.377 14.7 14.7 0 01-3.114-.343 1.169 1.169 0 00-1.428 1.046v.069c-.005.646.881 1.04 1.389 1.217z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(10.148 28.229) translate(-419.683 -419.013)"
      fill="#fd1a64"
    />
    <Path
      d="M422.628 419.869a9.2 9.2 0 003.125.36 10.626 10.626 0 003.354-.4c.663-.257 1.177-.526 1.177-1.177a1.175 1.175 0 00-1.04-1.166.681.681 0 00-.24.017 17.308 17.308 0 01-3.223.377 14.7 14.7 0 01-3.114-.343 1.169 1.169 0 00-1.428 1.046v.069c-.005.648.881 1.034 1.389 1.217z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(10.148 28.229) translate(-419.683 -417.479)"
      fill="#fd1a64"
    />
    <Path
      d="M433.658 417.5a.851.851 0 01.24-.017 1.179 1.179 0 011.04 1.166.97.97 0 01-.537.874 14.063 14.063 0 01-2.291-1.766c.726-.096 1.32-.21 1.548-.257z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(10.148 28.229) translate(-424.343 -417.476)"
      fill="#f97aa1"
    />
    <G fill="none" stroke="#24263d" strokeLinecap="round" strokeWidth={1}>
      <Path
        d="M20.735 0c-1.348.114-3.405.983-4.565 8.022"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(.049)"
      />
      <Path
        d="M11.599 0c1.348.114 3.405.983 4.565 8.022"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(.049)"
      />
      <Path
        d="M11.16 21.152H6.201l-2.76 1.023-2.228-1.766-1.211-2.017"
        strokeLinejoin="round"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(.049)"
      />
      <Path
        d="M11.719 22.569l-4.845.994-2.714 1.691s-.423 3.56 1.091 5.748"
        strokeLinejoin="round"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(.049)"
      />
      <Path
        d="M12.404 24.015l-3.891 1.663-1.1 2.423.029 1.834 1.428 2.394"
        strokeLinejoin="round"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(.049)"
      />
      <Path
        d="M21.084 21.152h4.96l2.76 1.023 2.234-1.766 1.211-2.017"
        strokeLinejoin="round"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(.049)"
      />
      <Path
        d="M20.524 22.569l4.845.994 2.714 1.691s.423 3.56-1.091 5.748"
        strokeLinejoin="round"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(.049)"
      />
      <Path
        d="M19.838 24.015l3.9 1.663 1.091 2.423-.029 1.834-1.428 2.394"
        strokeLinejoin="round"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(.049)"
      />
    </G>
    <Path
      d="M411.306 393.508a5.925 5.925 0 01-4.52-1.994 8.061 8.061 0 01-.983-1.617l-4.794-1.737s.04 7.3 10.49 7.3c.326 0 .486-.4.469-.72-.011-.266.549-1.232-.662-1.232z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164) translate(-400.864 -378.846)"
      fill="#fd1a64"
    />
    <Path
      d="M406 382.727s4.777-2.485 5.051-6.417a.8.8 0 00-.48-.828c-.349-.114-.691.154-.731.594a3.311 3.311 0 01-3.154 2.7s-.388-2.125 3.731-6.542a.218.218 0 00-.149-.366 8.447 8.447 0 00-6.965 3.177c-3.051 3.805-2.92 5.851-1.874 7.194 1.626 2.082 4.571.488 4.571.488z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164) translate(-400.754 -371.858)"
      fill="#fd1a64"
    />
    <Path
      d="M410.633 377.8a3.494 3.494 0 01-.92.171s-.36-1.977 3.3-6.074a8.358 8.358 0 011.091-.029.216.216 0 01.149.366c-2.512 2.694-3.353 4.533-3.62 5.566z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164) translate(-404.59 -371.858)"
      fill="#f97aa1"
    />
    <Path
      d="M405.257 384.425s4.737-2.217 5.011-6.148c0-.006.217-.074.217-.08a.489.489 0 01.326-.006.8.8 0 01.48.828c-.274 3.931-5.051 6.416-5.051 6.416s-2.948 1.588-4.571-.5a18.286 18.286 0 01-.348-.469c1.65 1.079 3.936-.041 3.936-.041z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164) translate(-400.997 -374.562)"
      fill="#f97aa1"
    />
    <Path
      d="M409.98 373.585a8.8 8.8 0 00-5.965 3.423 8.41 8.41 0 00-1.394 6.205c-2.48-1.434-2.074-3.834.891-7.531a8.447 8.447 0 016.965-3.177.216.216 0 01.148.366c-.225.245-.439.48-.645.714z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164) translate(-400.858 -372.132)"
      fill="#bf1057"
    />
    <Path
      d="M438.786 393.508a5.925 5.925 0 004.52-1.994 8.061 8.061 0 00.983-1.617l4.794-1.737s-.04 7.3-10.49 7.3c-.451 0-.32-.463-.446-.766-.104-.26-.224-1.186.639-1.186z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(21.324 2.164) translate(-438.075 -378.846)"
      fill="#fd1a64"
    />
    <Path
      d="M444.569 382.727s-4.777-2.485-5.051-6.417a.8.8 0 01.48-.828c.349-.114.691.154.731.594a3.311 3.311 0 003.154 2.7s.389-2.125-3.731-6.542a.218.218 0 01.149-.366 8.447 8.447 0 016.965 3.177c3.051 3.805 2.92 5.851 1.874 7.194-1.622 2.082-4.571.488-4.571.488z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(21.324 2.164) translate(-438.693 -371.858)"
      fill="#fd1a64"
    />
    <Path
      d="M442.15 373.956a8.235 8.235 0 014.811 2.565c1.526 1.646 3.085 3.64 2.765 4.959 1.468-1.468.949-2.743-2.017-6.439a8.447 8.447 0 00-6.965-3.177.216.216 0 00-.149.366c.223.246 1.349 1.492 1.555 1.726z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(21.324 2.164) translate(-439.13 -371.858)"
      fill="#f97aa1"
    />
    <Path
      d="M445.7 383.823c-1.891-.76-4.805-2.588-5.051-6.205v-.011a.489.489 0 00-.326-.006.8.8 0 00-.48.828c.274 3.931 5.051 6.417 5.051 6.417s2.948 1.588 4.571-.5c.046-.057.457-.7.5-.76a4.437 4.437 0 01-4.265.237z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(21.324 2.164) translate(-438.83 -374.309)"
      fill="#bf1057"
    />
    <Path
      d="M422.012 400.228c-6.1-11.256 3.183-18.118 3.183-18.118s9.285 6.862 3.188 18.112c.023-.006.04-.006.057-.011a.85.85 0 01.24-.017 1.179 1.179 0 011.04 1.166c0 .651-.514.994-1.177 1.177a12.7 12.7 0 01-3.354.4 10.933 10.933 0 01-3.342-.4c-.669-.223-1.177-.526-1.177-1.177v-.069a1.158 1.158 0 011.342-1.063z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(10.959 8.022) translate(-419.934 -382.11)"
      fill="#fd1a64"
    />
    <Path
      d="M428.467 384.07c2.3 2.371 6.611 8.4 1.954 16.993.023-.006.04-.006.057-.011a.851.851 0 01.24-.017 1.179 1.179 0 011.04 1.166c0 .651-.514.994-1.177 1.177a11.211 11.211 0 01-1.411.28 13.71 13.71 0 01-.7-19.587z"
      transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(10.959 8.022) translate(-421.973 -382.95)"
      fill="#f97aa1"
    />
    <G fill="none" stroke="#24263d" strokeWidth={1}>
      <Path
        d="M5.246 10.869s4.777-2.485 5.051-6.417a.8.8 0 00-.48-.828c-.349-.114-.691.154-.731.594a3.311 3.311 0 01-3.154 2.7S5.544 4.793 9.663.376A.218.218 0 009.514.01a8.447 8.447 0 00-6.965 3.177C-.502 6.992-.371 9.038.675 10.381c1.626 2.082 4.571.488 4.571.488z"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164)"
      />
      <Path
        d="M27.2 10.869s-4.777-2.485-5.051-6.417a.8.8 0 01.48-.828c.349-.114.691.154.731.594a3.311 3.311 0 003.154 2.7s.389-2.125-3.731-6.542a.218.218 0 01.149-.366 8.447 8.447 0 016.965 3.177c3.051 3.805 2.92 5.851 1.874 7.194-1.622 2.082-4.571.488-4.571.488z"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164)"
      />
      <Path
        d="M.672 10.377c1.28 1.646 3.383 1.006 4.217.663l.051.017a8.062 8.062 0 00.983 1.617 7.215 7.215 0 004.52 1.994c.217.029.428.057.634.091a12.776 12.776 0 00-.114 1.84l-.32.017C1.295 17.125.273 10.868.164 9.554a.027.027 0 01.051-.011 5.274 5.274 0 00.457.834z"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164)"
      />
      <Path
        d="M21.367 14.759c.217-.029.44-.063.669-.091a7.246 7.246 0 004.52-1.994 8.062 8.062 0 00.983-1.617l.034-.011c.846.349 2.925.966 4.2-.668a3.22 3.22 0 00.554-1.057h.006s-.057 7.868-10.49 7.3l-.36-.017a12.68 12.68 0 00-.116-1.845z"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164)"
      />
      <Path
        d="M13.037 23.976h0C6.937 12.72 16.22 5.858 16.22 5.858s9.285 6.862 3.188 18.112c.023-.006.04-.006.057-.011a.85.85 0 01.24-.017 1.179 1.179 0 011.04 1.166h0c0 .651-.514.994-1.177 1.177a12.7 12.7 0 01-3.354.4 10.933 10.933 0 01-3.342-.4c-.669-.223-1.177-.526-1.177-1.177h0v-.069a1.158 1.158 0 011.342-1.063z"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164)"
      />
      <Path
        d="M12.516 26.147c.114.051.234.091.36.137a10.762 10.762 0 003.342.4 12.7 12.7 0 003.354-.4 2.67 2.67 0 00.411-.149 1.168 1.168 0 01.76 1.1c0 .651-.514.92-1.177 1.177a10.6 10.6 0 01-3.354.4 9.2 9.2 0 01-3.125-.36c-.508-.177-1.394-.571-1.394-1.217v-.069a1.161 1.161 0 01.823-1.019z"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164)"
      />
      <Path
        d="M12.499 28.198a5.339 5.339 0 00.594.257 9.2 9.2 0 003.125.36 10.626 10.626 0 003.354-.4 4.449 4.449 0 00.469-.206 1.169 1.169 0 01.7 1.074c0 .651-.514.92-1.177 1.177a10.607 10.607 0 01-3.354.4 9.2 9.2 0 01-3.125-.36c-.508-.177-1.394-.571-1.394-1.217v-.069a1.158 1.158 0 01.808-1.016z"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164)"
      />
      <Path
        d="M10.791 31.638l1.708-1.394a4.443 4.443 0 00.594.257 9.2 9.2 0 003.125.36 10.625 10.625 0 003.354-.4c.154-.057.3-.12.428-.183l1.668 1.365a1.75 1.75 0 01.246 2.463 1.726 1.726 0 01-.9.583 7.117 7.117 0 00-4.777 2.046 2.242 2.242 0 00-3.605-.634 1.737 1.737 0 01-1.206-1.417 1.692 1.692 0 01-.88-.577 1.756 1.756 0 01.245-2.469z"
        strokeLinejoin="round"
        transform="translate(8.137) translate(12.079 12.016) translate(4.551 2.943) translate(0 2.164)"
      />
    </G>
    <G transform="translate(8.137) translate(12.079 12.016)">
      <Path
        d="M395.5 409.66a4.163 4.163 0 002.708 2.708 4.163 4.163 0 00-2.708 2.708 4.163 4.163 0 00-2.708-2.708 4.163 4.163 0 002.708-2.708z"
        transform="translate(-392.79 -382.954)"
        fill="#ffbc00"
      />
      <Path
        d="M461.95 396.92a2.979 2.979 0 002.725 0 2.979 2.979 0 000 2.725 2.979 2.979 0 00-2.725 0 2.979 2.979 0 000-2.725z"
        transform="translate(-422.434 -377.493)"
        fill="#ffbc00"
      />
      <Circle cx={0.897} cy={0.897} r={0.897} transform="translate(7.079 35.922)" fill="#ffbc00" />
      <Circle cx={0.931} cy={0.931} r={0.931} transform="translate(10.833)" fill="#ffbc00" />
      <G
        transform="translate(35.648 26.466)"
        fill="none"
        stroke="#904dff"
        strokeLinecap="round"
        strokeWidth={1}
      >
        <Path transform="translate(1.537)" d="M0.463 0L0 0.469" />
        <Path transform="translate(0 1.537)" d="M0.463 0L0 0.469" />
        <Path transform="translate(1.537 1.537)" d="M0.463 0.469L0 0" />
        <Path transform="translate(0 .006)" d="M0.463 0.463L0 0" />
      </G>
      <G
        transform="translate(32.037 2.308)"
        fill="none"
        stroke="#904dff"
        strokeLinecap="round"
        strokeWidth={1}
      >
        <Path transform="translate(1.537)" d="M0.463 0L0 0.469" />
        <Path transform="translate(0 1.537)" d="M0.463 0L0 0.469" />
        <Path transform="translate(1.537 1.537)" d="M0.463 0.469L0 0" />
        <Path d="M0.463 0.469L0 0" />
      </G>
      <G
        transform="translate(.543 16.096)"
        fill="none"
        stroke="#904dff"
        strokeLinecap="round"
        strokeWidth={1}
      >
        <Path transform="translate(1.417)" d="M0 0L0 0.663" />
        <Path transform="translate(1.417 2.171)" d="M0 0L0 0.663" />
        <Path transform="translate(2.171 1.417)" d="M0.663 0L0 0" />
        <Path transform="translate(0 1.417)" d="M0.663 0L0 0" />
      </G>
    </G>
  </Svg>
)

export default RewardBadgeLobster
