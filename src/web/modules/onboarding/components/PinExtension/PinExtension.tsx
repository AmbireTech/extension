import React from 'react'
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop, SvgProps } from 'react-native-svg'

import colors from '@common/styles/colors'

// TODO: Split all elements and text into separate components for better resposiveness
const PinExtension = (props: SvgProps) => (
  <Svg width="533" height="164" viewBox="0 0 533 164" {...props}>
    <Defs>
      <filter id="Rectangle_1055" x="0" y="0" width="533" height="164" filterUnits="userSpaceOnUse">
        <feOffset dy="6" input="SourceAlpha" />
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feFlood floodColor={colors.martinique} floodOpacity="0.239" />
        <feComposite operator="in" in2="blur" />
        <feComposite in="SourceGraphic" />
      </filter>
      <LinearGradient
        id="linear-gradient"
        x1="0.949"
        y1="0.03"
        x2="0.036"
        y2="0.962"
        gradientUnits="objectBoundingBox"
      >
        <Stop offset="0" stopColor="#b140ec" />
        <Stop offset="0.378" stopColor="#8333ea" />
        <Stop offset="0.61" stopColor="#5f20d1" />
        <Stop offset="1" stopColor={colors.darkViolet} />
      </LinearGradient>
      <LinearGradient
        id="linear-gradient-2"
        x1="-0.323"
        y1="-0.158"
        x2="1.323"
        y2="1.158"
        gradientUnits="objectBoundingBox"
      >
        <Stop offset="0" stopColor="#bbbdbf" />
        <Stop offset="0.671" stopColor="#dddedf" />
        <Stop offset="1" stopColor="#fff" />
      </LinearGradient>
    </Defs>
    <G
      id="pin_the_Ambire_extension"
      data-name="pin the Ambire extension"
      transform="translate(-921 -64)"
    >
      <G
        id="pin_the_extension"
        data-name="pin the extension"
        transform="translate(11944.357 20096)"
      >
        <G transform="matrix(1, 0, 0, 1, -11023.36, -20032)" filter="url(#Rectangle_1055)">
          <G
            id="Rectangle_1055-2"
            data-name="Rectangle 1055"
            transform="translate(18 12)"
            fill="#fff"
            stroke="rgba(103,112,179,0.2)"
            strokeWidth="1"
          >
            <Rect width="497" height="128" rx="12" stroke="none" />
            <Rect x="0.5" y="0.5" width="496" height="127" rx="11.5" fill="none" />
          </G>
        </G>
        <Path
          id="Path_2355"
          data-name="Path 2355"
          d="M4.18-7.62v-4.06H6.4c1.58,0,2.28.76,2.28,2.04,0,1.24-.7,2.02-2.28,2.02Zm7.38-2.02c0-2.42-1.68-4.32-5.04-4.32H1.38V0h2.8V-5.36H6.52C10.12-5.36,11.56-7.52,11.56-9.64ZM13.54,0h2.8V-11.08h-2.8Zm1.42-12.4a1.654,1.654,0,0,0,1.72-1.64,1.654,1.654,0,0,0-1.72-1.64,1.642,1.642,0,0,0-1.72,1.64A1.642,1.642,0,0,0,14.96-12.4ZM26.86,0h2.8V-6.5c0-3.06-1.84-4.74-4.42-4.74A4.139,4.139,0,0,0,21.9-9.7v-1.38H19.1V0h2.8V-6.12c0-1.78.98-2.74,2.5-2.74,1.48,0,2.46.96,2.46,2.74ZM37.52-3.44C37.52-.9,38.94,0,41.06,0h1.76V-2.36h-1.3c-.88,0-1.18-.32-1.18-1.06V-8.78h2.48v-2.3H40.34v-2.74H37.52v2.74H36.2v2.3h1.32ZM44.84,0h2.8V-6.12c0-1.78.98-2.74,2.5-2.74,1.48,0,2.46.96,2.46,2.74V0h2.8V-6.5c0-3.06-1.82-4.74-4.32-4.74A4.258,4.258,0,0,0,47.64-9.7v-5.1h-2.8ZM62.82-8.96a2.462,2.462,0,0,1,2.64,2.38H60.2A2.573,2.573,0,0,1,62.82-8.96Zm5.26,5.48H65.06a2.283,2.283,0,0,1-2.22,1.34A2.592,2.592,0,0,1,60.18-4.7h8.1a6.544,6.544,0,0,0,.08-1.08,5.2,5.2,0,0,0-5.46-5.48,5.324,5.324,0,0,0-5.56,5.72A5.366,5.366,0,0,0,62.9.18,5.15,5.15,0,0,0,68.08-3.48ZM84.64,0H87.6L82.58-13.98H79.32L74.3,0h2.94l.92-2.66h5.56ZM82.96-4.9H78.92l2.02-5.84ZM104.98,0h2.8V-6.5c0-3.06-1.88-4.74-4.54-4.74a4.387,4.387,0,0,0-3.8,2.12,4.241,4.241,0,0,0-3.9-2.12,4.034,4.034,0,0,0-3.26,1.5v-1.34h-2.8V0h2.8V-6.12a2.367,2.367,0,0,1,2.5-2.68,2.357,2.357,0,0,1,2.46,2.68V0h2.8V-6.12a2.362,2.362,0,0,1,2.48-2.68,2.357,2.357,0,0,1,2.46,2.68Zm8.26-9.46V-14.8h-2.8V0h2.8V-1.58A4.363,4.363,0,0,0,116.9.18c2.84,0,5.06-2.3,5.06-5.76s-2.22-5.68-5.06-5.68A4.318,4.318,0,0,0,113.24-9.46Zm5.86,3.88a3.031,3.031,0,0,1-2.94,3.3,2.991,2.991,0,0,1-2.92-3.26,2.991,2.991,0,0,1,2.92-3.26A2.959,2.959,0,0,1,119.1-5.58ZM124,0h2.8V-11.08H124Zm1.42-12.4a1.654,1.654,0,0,0,1.72-1.64,1.654,1.654,0,0,0-1.72-1.64,1.642,1.642,0,0,0-1.72,1.64A1.642,1.642,0,0,0,125.42-12.4Zm6.94,6.88c0-2.14,1-2.78,2.66-2.78h.74v-2.94a3.843,3.843,0,0,0-3.4,1.88v-1.72h-2.8V0h2.8ZM142.4-8.96a2.462,2.462,0,0,1,2.64,2.38h-5.26A2.573,2.573,0,0,1,142.4-8.96Zm5.26,5.48h-3.02a2.283,2.283,0,0,1-2.22,1.34,2.592,2.592,0,0,1-2.66-2.56h8.1a6.545,6.545,0,0,0,.08-1.08,5.2,5.2,0,0,0-5.46-5.48,5.324,5.324,0,0,0-5.56,5.72A5.366,5.366,0,0,0,142.48.18,5.15,5.15,0,0,0,147.66-3.48ZM159.5-8.96a2.462,2.462,0,0,1,2.64,2.38h-5.26A2.573,2.573,0,0,1,159.5-8.96Zm5.26,5.48h-3.02a2.283,2.283,0,0,1-2.22,1.34,2.592,2.592,0,0,1-2.66-2.56h8.1a6.545,6.545,0,0,0,.08-1.08,5.2,5.2,0,0,0-5.46-5.48,5.324,5.324,0,0,0-5.56,5.72A5.366,5.366,0,0,0,159.58.18,5.15,5.15,0,0,0,164.76-3.48ZM173.2,0h3.16l-3.68-5.56,3.64-5.52h-3l-2.04,3.42-2.26-3.42h-3.16l3.66,5.52L165.9,0h3l2.02-3.44Zm5.12-3.44c0,2.54,1.42,3.44,3.54,3.44h1.76V-2.36h-1.3c-.88,0-1.18-.32-1.18-1.06V-8.78h2.48v-2.3h-2.48v-2.74h-2.82v2.74H177v2.3h1.32ZM190.4-8.96a2.462,2.462,0,0,1,2.64,2.38h-5.26A2.573,2.573,0,0,1,190.4-8.96Zm5.26,5.48h-3.02a2.283,2.283,0,0,1-2.22,1.34,2.592,2.592,0,0,1-2.66-2.56h8.1a6.545,6.545,0,0,0,.08-1.08,5.2,5.2,0,0,0-5.46-5.48,5.324,5.324,0,0,0-5.56,5.72A5.366,5.366,0,0,0,190.48.18,5.15,5.15,0,0,0,195.66-3.48ZM205.74,0h2.8V-6.5c0-3.06-1.84-4.74-4.42-4.74a4.139,4.139,0,0,0-3.34,1.54v-1.38h-2.8V0h2.8V-6.12c0-1.78.98-2.74,2.5-2.74,1.48,0,2.46.96,2.46,2.74ZM219.8-3.16c-.08-4.06-6.22-2.8-6.22-4.82,0-.64.54-1.06,1.58-1.06a1.651,1.651,0,0,1,1.86,1.44h2.68c-.16-2.2-1.78-3.66-4.46-3.66-2.74,0-4.38,1.48-4.38,3.32,0,4.06,6.26,2.8,6.26,4.78,0,.64-.6,1.14-1.7,1.14a1.839,1.839,0,0,1-2-1.48H210.6c.12,2.06,2.06,3.68,4.84,3.68C218.14.18,219.8-1.26,219.8-3.16ZM222.1,0h2.8V-11.08h-2.8Zm1.42-12.4a1.654,1.654,0,0,0,1.72-1.64,1.654,1.654,0,0,0-1.72-1.64,1.642,1.642,0,0,0-1.72,1.64A1.642,1.642,0,0,0,223.52-12.4Zm14.84,6.86a5.475,5.475,0,0,0-5.7-5.72,5.475,5.475,0,0,0-5.7,5.72A5.423,5.423,0,0,0,232.58.18,5.54,5.54,0,0,0,238.36-5.54Zm-8.56,0c0-2.22,1.34-3.28,2.82-3.28s2.86,1.06,2.86,3.28a2.949,2.949,0,0,1-2.9,3.28C231.08-2.26,229.8-3.34,229.8-5.54ZM248.18,0h2.8V-6.5c0-3.06-1.84-4.74-4.42-4.74a4.139,4.139,0,0,0-3.34,1.54v-1.38h-2.8V0h2.8V-6.12c0-1.78.98-2.74,2.5-2.74,1.48,0,2.46.96,2.46,2.74Z"
          transform="translate(-10868.357 -19961)"
          fill={colors.martinique}
        />
        <Path
          id="Path_3049"
          data-name="Path 3049"
          d="M-7121.745-8371.361l-.852-9.1h-7.118v-2.485l3.125-4.143v-9.532h-1.62V-8401h14.242v4.379h-1.659v9.532l2.848,4.143v2.485h-7.118l-.85,9.1Zm-133.243,0v-2.116a3.812,3.812,0,0,0-3.81-3.81,3.813,3.813,0,0,0-3.812,3.81v2.116h-5.361a2.83,2.83,0,0,1-2.823-2.822v-5.364h2.117a3.811,3.811,0,0,0,3.81-3.81,3.812,3.812,0,0,0-3.81-3.81h-2.1v-5.364a2.819,2.819,0,0,1,2.811-2.823h5.644v-2.116A3.531,3.531,0,0,1-7258.8-8401a3.529,3.529,0,0,1,3.527,3.529v2.116h5.646a2.83,2.83,0,0,1,2.823,2.823v5.646h2.117a3.529,3.529,0,0,1,3.529,3.527,3.531,3.531,0,0,1-3.529,3.529h-2.117v5.645a2.829,2.829,0,0,1-2.823,2.822Zm87.189-12.5a5.323,5.323,0,0,1,5.56-5.72,5.2,5.2,0,0,1,5.46,5.479,6.439,6.439,0,0,1-.08,1.079h-8.1a2.593,2.593,0,0,0,2.661,2.56,2.285,2.285,0,0,0,2.22-1.341h3.019a5.147,5.147,0,0,1-5.18,3.66A5.365,5.365,0,0,1-7167.8-8383.859Zm2.861-1.041h5.26a2.463,2.463,0,0,0-2.64-2.381A2.574,2.574,0,0,0-7164.937-8384.9Zm-42.161,1c0-3.462,2.241-5.68,5.081-5.68a4.551,4.551,0,0,1,3.62,1.718v-5.258h2.84v14.8h-2.84v-1.641a4.187,4.187,0,0,1-3.641,1.819C-7204.857-8378.142-7207.1-8380.439-7207.1-8383.9Zm2.861,0a3.028,3.028,0,0,0,2.92,3.3,2.984,2.984,0,0,0,2.939-3.26,2.985,2.985,0,0,0-2.939-3.262A2.956,2.956,0,0,0-7204.237-8383.9Zm-29.64,0c0-3.462,2.239-5.68,5.061-5.68a4.376,4.376,0,0,1,3.658,1.758v-1.579h2.821v11.08h-2.821v-1.619a4.365,4.365,0,0,1-3.679,1.8C-7231.638-8378.142-7233.877-8380.439-7233.877-8383.9Zm2.859,0a3.03,3.03,0,0,0,2.92,3.3,2.984,2.984,0,0,0,2.939-3.26,2.985,2.985,0,0,0-2.939-3.262A2.957,2.957,0,0,0-7231.018-8383.9Zm-74.181.04c0-3.48,2.281-5.72,5.482-5.72a4.942,4.942,0,0,1,5.22,3.919h-3.021a2.178,2.178,0,0,0-2.22-1.541c-1.56,0-2.6,1.181-2.6,3.342s1.04,3.318,2.6,3.318a2.114,2.114,0,0,0,2.22-1.52h3.021a5.053,5.053,0,0,1-5.22,3.919C-7302.917-8378.142-7305.2-8380.381-7305.2-8383.859Zm-23.158,0c0-3.48,2.279-5.72,5.479-5.72a4.942,4.942,0,0,1,5.22,3.919h-3.021a2.174,2.174,0,0,0-2.218-1.541c-1.56,0-2.6,1.181-2.6,3.342s1.042,3.318,2.6,3.318a2.112,2.112,0,0,0,2.218-1.52h3.021a5.053,5.053,0,0,1-5.22,3.919C-7326.078-8378.142-7328.357-8380.381-7328.357-8383.859Zm181.379,5.539v-6.121c0-1.779-.98-2.738-2.46-2.738-1.518,0-2.5.959-2.5,2.738v6.121h-2.8v-11.08h2.8v1.379a4.14,4.14,0,0,1,3.34-1.539c2.581,0,4.419,1.681,4.419,4.74v6.5Zm-25.56,0v-6.121c0-1.779-.98-2.738-2.46-2.738-1.521,0-2.5.959-2.5,2.738v6.121h-2.8v-14.8h2.8v5.1a4.257,4.257,0,0,1,3.438-1.539c2.5,0,4.32,1.681,4.32,4.74v6.5Zm-11.54,0c-2.121,0-3.54-.9-3.54-3.441v-5.338h-1.32v-2.3h1.32v-2.74h2.819v2.74h2.481v2.3h-2.481v5.359c0,.74.3,1.061,1.181,1.061h1.3v2.359Zm-27.761,0v-6.121c0-1.779-.98-2.738-2.46-2.738-1.518,0-2.5.959-2.5,2.738v6.121h-2.8v-11.08h2.8v1.379a4.14,4.14,0,0,1,3.34-1.539c2.581,0,4.419,1.681,4.419,4.74v6.5Zm-74.04,0-3.759-4.719v4.719h-2.8v-14.8h2.8v8.419l3.719-4.7h3.641l-4.881,5.56,4.918,5.521Zm-24.16,0v-11.08h2.8v11.08Zm-5.56,0v-14.8h2.8v14.8Zm5.26-14.04a1.642,1.642,0,0,1,1.718-1.641,1.655,1.655,0,0,1,1.721,1.641,1.655,1.655,0,0,1-1.721,1.641A1.642,1.642,0,0,1-7310.337-8392.36Z"
          transform="translate(-3539.34 -11552)"
          fill="rgba(45,49,77,0.65)"
        />
        <Path
          id="Path_2999"
          data-name="Path 2999"
          d="M1407.874,86.8a84.242,84.242,0,0,1-5.082,10.566l-6.313,10.968,7.088-2.157a190.324,190.324,0,0,1-1.934,28.569,211.953,211.953,0,0,1-6.888,28.766l13.21-6.47,12.935,6.47a201.32,201.32,0,0,1-6.716-28.3,201.559,201.559,0,0,1-1.922-29.033l7.639,2.157-6.663-11.024A85.53,85.53,0,0,1,1407.874,86.8Z"
          transform="translate(-11953.5 -20095.805)"
          fill={colors.greenHaze}
        />
        <G id="icon">
          <Path
            id="base"
            d="M12,0H84A12,12,0,0,1,96,12V83A12,12,0,0,1,84,95H12A12,12,0,0,1,0,83V12A12,12,0,0,1,12,0Z"
            transform="translate(-10988.357 -20003)"
            fill="url(#linear-gradient)"
          />
          <G id="symbol" transform="translate(-11463.04 -20487.291)">
            <G id="_2171347963424" transform="translate(496.683 490.354)">
              <Path
                id="Path_3041"
                data-name="Path 3041"
                d="M830.152,2619.323l-5.113,14.506a.635.635,0,0,0,.033.5l4.775,9.38-13.121,7.434a.319.319,0,0,1-.446-.14l-2.838-5.906a.637.637,0,0,1,.042-.625l16.553-25.2A.064.064,0,0,1,830.152,2619.323Z"
                transform="translate(-811.634 -2607.499)"
                fill="#bbbdbf"
              />
              <Path
                id="Path_3042"
                data-name="Path 3042"
                d="M5198.983,6152.083l10.869,23.149a.637.637,0,0,1-.134.729l-28.577,27.6a.32.32,0,0,1-.542-.229v-25.378l18.017-17.385a.635.635,0,0,0,.2-.454l.049-8.009A.064.064,0,0,1,5198.983,6152.083Z"
                transform="translate(-5154.772 -6120.826)"
                fill="#bbbdbf"
              />
              <Path
                id="Path_3043"
                data-name="Path 3043"
                d="M987.452,7056.93l-15.592,3.078,2.026,4.218a.32.32,0,0,0,.446.14h0l13.121-7.435Z"
                transform="translate(-969.24 -7020.722)"
                fill="#abaeaf"
              />
              <Path
                id="Path_3044"
                data-name="Path 3044"
                d="M830.7,2633.982l-11.592,10.623a.629.629,0,0,1,.073-.151l16.553-25.205h0a.062.062,0,0,1,.052-.029h0a.064.064,0,0,1,.062.085l-5.113,14.506h0A.64.64,0,0,0,830.7,2633.982Z"
                transform="translate(-817.332 -2607.482)"
                fill="#e5e6e7"
              />
              <Path
                id="Path_3045"
                data-name="Path 3045"
                d="M5191.085,9028.419l-10.417,24.372v-14.32Z"
                transform="translate(-5154.841 -8981.339)"
                fill="#abaeaf"
              />
              <Path
                id="Path_3046"
                data-name="Path 3046"
                d="M8477.96,6175.7l-11.181-15.184a.635.635,0,0,0,.094-.326l.049-8.009h0a.064.064,0,0,1,.065-.064h0a.061.061,0,0,1,.056.037l10.868,23.15h0A.62.62,0,0,1,8477.96,6175.7Z"
                transform="translate(-8422.831 -6120.897)"
                fill="#e5e6e7"
              />
              <Path
                id="Path_3047"
                data-name="Path 3047"
                d="M522.75,490.434l12.067,29.558a.636.636,0,0,1,0,.491l-19.491,45.6a.32.32,0,0,1-.516.1l-17.928-17.317a.638.638,0,0,1-.07-.837l25.572-34.642a.638.638,0,0,0,.125-.378V490.482A.128.128,0,0,1,522.75,490.434Z"
                transform="translate(-496.683 -490.354)"
                fill="url(#linear-gradient-2)"
              />
              <Path
                id="Path_3048"
                data-name="Path 3048"
                d="M5174.229,513.216l12.388,7a.643.643,0,0,0-.046-.212h0L5174.5,490.449a.124.124,0,0,0-.117-.08h0a.126.126,0,0,0-.129.128h0v22.529A.623.623,0,0,1,5174.229,513.216Z"
                transform="translate(-5148.437 -490.369)"
                fill="#e5e6e7"
              />
            </G>
          </G>
        </G>
      </G>
    </G>
  </Svg>
)

export default PinExtension
