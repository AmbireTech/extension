import React, { FC } from 'react'
import Svg, { Defs, G, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

const SwordIcon: FC<SvgProps & { className?: string }> = ({ width = 64, height = 64, ...rest }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 64 64" fill="none" {...rest}>
      <Path
        d="M26.72 39.337l-14.65-5.953-.387 2.397s7.499 9.587 7.808 9.819c.31.231 10.94 7.035 10.94 7.035l2.32-.89S26.758 39.57 26.72 39.3v.038z"
        fill="url(#sword-paint0_linear_988_2386)"
      />
      <G opacity={0.2} fill="#F7BA2F">
        <Path d="M32.75 51.784s-.773-1.546-1.778-3.595l-3.711-3.943s-1.198 2.977-.657 5.953a274.298 274.298 0 003.827 2.436l2.32-.89v.04zM11.683 35.78s2.048 2.63 4.059 5.18c.077-1.739-.464-4.367-1.083-6.532l-2.59-1.044-.386 2.397z" />
      </G>
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.8}
      >
        <Path
          d="M22.506 41c3.673 2.938 7.654 7.963 10.244 10.746-1.623-3.286-6.03-12.215-6.03-12.447l-14.65-5.953-.117.773c3.286 1.933 6.92 3.943 10.553 6.842V41z"
          fill="#991E1E"
        />
      </G>
      <Path
        d="M21.694 31.915S41.757 3.89 44.076 2.537C45.236 1.84 56.33-.401 62.438.063c.85 4.175.116 12.988-1.585 17.975-.31.927-26.982 23.58-26.982 23.58l-12.177-9.664v-.039z"
        fill="url(#sword-paint1_linear_988_2386)"
      />
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.3}
      >
        <Path
          d="M46.164 19.275s-1.779 1.043-2.59 2.512c-.464.85.58 5.064 1.546 8.466 2.59-2.358 5.605-4.445 7.886-6.572l-6.842-4.406z"
          fill="#4D6780"
        />
      </G>
      <G
        style={{
          mixBlendMode: 'soft-light'
        }}
      >
        <Path
          d="M61.587 3.155c-.077 0-.154 0-.232.077l-13.8 14.612c-.116.116-.077.271 0 .387a37.247 37.247 0 006.262 4.6c.116.077.232.039.348 0 3.132-2.629 5.45-4.6 5.567-4.832 1.585-4.02 2.629-11.056 2.165-14.535 0-.116-.116-.232-.271-.232l-.039-.077z"
          fill="#FAF3F3"
        />
      </G>
      <G
        style={{
          mixBlendMode: 'soft-light'
        }}
      >
        <Path
          d="M44.076 2.537c-2.32 1.353-22.382 29.378-22.382 29.378l2.474 1.972 4.716 1.778c.464-.618 26.673-28.837 32.974-35.641-6.223-.27-16.66 1.856-17.782 2.513z"
          fill="#FAF3F3"
        />
      </G>
      <G
        style={{
          mixBlendMode: 'soft-light'
        }}
      >
        <Path
          d="M43.96 3.503c-.348.193-1.198 1.121-2.32 2.474a1.336 1.336 0 00-.115 1.546c1.275 2.088 1.623 5.915 1.74 8.698 0 1.198 1.507 1.74 2.319.89 4.754-5.142 9.548-10.283 12.64-13.608.812-.889.155-2.32-1.043-2.242-5.528.31-12.332 1.778-13.182 2.28l-.039-.038z"
          fill="#FAF3F3"
        />
      </G>
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.3}
      >
        <Path
          d="M62.438.063c-.31 0-.464.154-.773.154l-18.362 19.87-15.617 16.892 1.662 1.005c2.474-3.633 5.296-7.576 6.301-8.775C37.08 27.51 55.828 8.026 62.593.99c-.04-.309-.078-.618-.155-.889V.063z"
          fill="#4D6780"
        />
      </G>
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.8}
      >
        <Path
          d="M32.789 40.729l1.082.85S60.544 18.927 60.853 18c.155-.425.27-.85.386-1.314a48.886 48.886 0 00-1.005 1.276c-.502.773-4.406 4.368-4.406 4.368s-1.779.85-1.624 1.43c.155.58-6.224 4.793-6.958 5.45-.696.658-6.88 5.49-14.457 11.481v.039z"
          fill="#CADBEB"
        />
      </G>
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.8}
      >
        <Path
          d="M62.438.063C56.33-.401 45.236 1.88 44.076 2.537c-2.32 1.353-22.382 29.378-22.382 29.378l1.508 1.199c-.657-4.291 7.151-10.901 7.847-12.64.696-1.74 12.563-17.396 12.563-17.396C48.986 1.493 55.442.604 62.477.1l-.039-.038z"
          fill="#CADBEB"
        />
      </G>
      <Path
        d="M12.069 33.384s10.437 6.263 12.254 7.886c1.817 1.624 8.427 10.476 8.427 10.476l5.992-5.296s-7.925-11.52-8.737-12.293c-.811-.773-13.607-6.494-13.607-6.494l-4.33 5.683v.038z"
        fill="url(#sword-paint2_linear_988_2386)"
      />
      <Path
        d="M17.713 40.535s-4.136 6.302-11.288 10.902l8.505 7.576c3.363-6.687 9.857-12.176 9.857-12.176-1.198-5.838-7.074-6.302-7.074-6.302z"
        fill="url(#sword-paint3_linear_988_2386)"
      />
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.8}
      >
        <Path
          d="M17.713 40.535s-1.585 2.436-4.485 5.374c1.895-.735 3.557-.735 4.485.154 2.048 1.895.232 7.152-4.06 11.83l1.276 1.12c3.364-6.687 9.858-12.176 9.858-12.176-1.199-5.838-7.074-6.302-7.074-6.302z"
          fill="#991E1E"
        />
      </G>
      <Path
        d="M3.835 49.001c7.268.89 13.182 7.23 13.53 12.061L11.219 64c-4.717-1.585-8.35-4.059-10.012-8.04l2.628-6.92v-.039z"
        fill="url(#sword-paint4_linear_988_2386)"
      />
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.3}
      >
        <Path
          d="M16.94 58.975c-3.093 2.28-8.273 2.59-13.298.54 1.932 1.972 4.522 3.402 7.615 4.446l6.146-2.938c-.038-.657-.232-1.353-.464-2.087v.039z"
          fill="#991E1E"
        />
      </G>
      <Path
        d="M58.727 1.88s-3.17 2.86-3.711 2.628c-.541-.232-3.788-1.005-2.165-1.933 1.624-.927 5.876-.695 5.876-.695zM50.88 3.194c.464.077-1.082 1.7-2.435 1.314-1.353-.387 1.971-1.392 2.435-1.314z"
        fill="#FAF3F3"
      />
      <Path
        d="M30.044 34.196c-.812-.773-13.607-6.494-13.607-6.494l-1.314 1.7c6.417.464 14.573 4.523 14.882 5.065.387.618 2.397 5.257 2.397 5.257l.464-1.16 3.904 5.721s-.89 1.856 0 3.982l2.01-1.778s-7.924-11.52-8.736-12.293z"
        fill="#F7BA2F"
      />
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.5}
        fill="#731717"
      >
        <Path d="M17.906 28.359a175.473 175.473 0 00-3.904 6.185c.386.232.812.503 1.276.773.773-2.203 1.894-4.484 3.71-6.494-.386-.193-.773-.348-1.082-.503v.039zM27.918 45.522c.232-3.75.85-8.195 2.397-10.94-.155-.193-.271-.309-.31-.386-.425-.387-3.943-2.087-7.306-3.634-1.043 2.049-2.203 4.755-3.285 7.384.386.27.811.502 1.16.734 1.545-2.474 3.13-4.523 4.135-4.561 1.392 0 1.006 4.368.464 8.079.735.85 1.74 2.049 2.706 3.286l.039.038zM33.02 38.255c-1.7 3.556-3.903 8.582-2.666 9.393.889.58 4.6-1.739 6.88-3.401-1.16-1.662-2.783-4.02-4.213-6.03v.038z" />
      </G>
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.8}
      >
        <Path
          d="M18.679 28.707s-.077 0-.116-.039c-1.121 1.585-2.822 4.098-3.943 6.263.155.116.348.231.541.347 1.199-2.28 2.436-4.561 3.518-6.571z"
          fill="#991E1E"
        />
      </G>
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.8}
        fill="#991E1E"
      >
        <Path d="M23.047 30.717c-.928 2.049-2.28 5.025-3.363 7.383l.348.232c.773-2.28 2.28-5.566 3.518-7.383-.155-.077-.348-.155-.503-.232zM26.526 43.783c.077-1.817.232-3.866.232-4.755 0-1.005 0-3.981.734-6.223-.348-.155-.695-.348-1.043-.503.27 2.126 0 7.5-.387 10.862.155.194.348.426.502.619h-.038z" />
      </G>
      <Path
        d="M32.828 38.023c-1.199 1.817-2.938 4.87-3.325 2.822-.387-2.087.812-6.224.812-6.224l2.512 3.44v-.038z"
        fill="#F7BA2F"
      />
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.8}
        fill="#991E1E"
      >
        <Path d="M18.795 53.099C16.862 50.973 13.963 49 11.45 47.57c-.425.387-.85.735-1.275 1.121 2.783 1.469 5.528 4.33 7.229 6.301.463-.657.927-1.276 1.43-1.894h-.039zM16.205 42.546a31.5 31.5 0 01-2.049 2.358c2.474 1.585 5.026 4.059 6.688 5.798.734-.812 1.43-1.508 2.01-2.087-1.276-1.972-3.518-4.678-6.688-6.07h.039z" />
      </G>
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.3}
      >
        <Path
          d="M5.613 61.255c-.58-4.832-3.479-5.064.232-11.828-.657-.155-1.314-.31-2.01-.387l-2.628 6.92c.927 2.203 2.435 3.904 4.406 5.295z"
          fill="#991E1E"
        />
      </G>
      <Path
        style={{
          mixBlendMode: 'screen'
        }}
        opacity={0.5}
        d="M15.123 55.998c.039 0 .077-.038.116-.077-1.894-2.59-4.87-4.987-8.35-6.185-2.049 2.203-2.822 4.755-1.778 6.456 1.469 2.396 5.953 2.28 10.012-.194z"
        fill="url(#sword-paint5_linear_988_2386)"
      />
      <Path
        d="M11.914 52.867c2.86 2.126 3.48 3.904 3.48 3.904s-3.054.773-4.02-.464c-.967-1.237.54-3.44.54-3.44z"
        fill="#FAF3F3"
      />
      <Path
        style={{
          mixBlendMode: 'screen'
        }}
        opacity={0.5}
        d="M11.257 64l6.147-2.938c-.04-.502-.155-1.043-.31-1.623-1.817 1.043-4.29 2.396-7.19 4.02.464.193.928.348 1.392.502l-.039.04z"
        fill="url(#sword-paint6_linear_988_2386)"
      />
      <Path
        d="M1.245 55.882v.078c1.662 3.942 5.219 6.416 9.896 8.001-1.74-3.363-5.412-6.687-9.896-8.079z"
        fill="url(#sword-paint7_linear_988_2386)"
      />
      <G
        style={{
          mixBlendMode: 'multiply'
        }}
        opacity={0.8}
      >
        <Path
          d="M1.555 56.655c2.938.078 5.991 2.629 8.659 6.958.309.116.618.232.966.348-1.74-3.363-5.412-6.687-9.896-8.079v.078c.077.231.193.463.31.695h-.04z"
          fill="#991E1E"
        />
      </G>
      <G
        style={{
          mixBlendMode: 'soft-light'
        }}
      >
        <Path
          d="M42.569 14.752c.116 1.082.657 2.551-.541 4.407-1.199 1.817-4.755 5.489-4.485 4.33.31-1.16 4.6-12.37 5.026-8.737z"
          fill="#FAF3F3"
        />
      </G>
      <Defs>
        <LinearGradient
          id="sword-paint0_linear_988_2386"
          x1={18.2353}
          y1={47.5927}
          x2={24.4924}
          y2={40.0414}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#991E1E" />
          <Stop offset={1} stopColor="#731717" />
        </LinearGradient>
        <LinearGradient
          id="sword-paint1_linear_988_2386"
          x1={19.926}
          y1={33.4522}
          x2={66.3873}
          y2={5.6325}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#4D6780" />
          <Stop offset={0.561} stopColor="#CADBEB" />
          <Stop offset={0.826} stopColor="#E5DEDE" />
        </LinearGradient>
        <LinearGradient
          id="sword-paint2_linear_988_2386"
          x1={17.5276}
          y1={43.9575}
          x2={32.1136}
          y2={35.1967}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#731717" />
          <Stop offset={0.6} stopColor="#D14F4F" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
        <LinearGradient
          id="sword-paint3_linear_988_2386"
          x1={10.3591}
          y1={55.4852}
          x2={20.4625}
          y2={44.6291}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#991E1E" />
          <Stop offset={1} stopColor="#731717" />
        </LinearGradient>
        <LinearGradient
          id="sword-paint4_linear_988_2386"
          x1={1.70977}
          y1={53.4156}
          x2={17.4105}
          y2={60.9045}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#B38824" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
        <LinearGradient
          id="sword-paint5_linear_988_2386"
          x1={11.561}
          y1={52.2471}
          x2={1.59723}
          y2={63.1698}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#EBE1CA" />
          <Stop offset={0.2} stopColor="#F7BA2F" />
          <Stop offset={0.4} stopColor="#B38824" />
          <Stop offset={0.6} stopColor="#996B00" />
          <Stop offset={0.8} stopColor="#6A4C05" />
          <Stop offset={0.9} stopColor="#553D04" />
          <Stop offset={1} stopColor="#412E02" />
        </LinearGradient>
        <LinearGradient
          id="sword-paint6_linear_988_2386"
          x1={14.8742}
          y1={63.9777}
          x2={12.462}
          y2={59.7864}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#EBE1CA" />
          <Stop offset={0.2} stopColor="#F7BA2F" />
          <Stop offset={0.4} stopColor="#B38824" />
          <Stop offset={0.6} stopColor="#996B00" />
          <Stop offset={0.8} stopColor="#694B05" />
          <Stop offset={0.9} stopColor="#4C3705" />
          <Stop offset={1} stopColor="#312301" />
        </LinearGradient>
        <LinearGradient
          id="sword-paint7_linear_988_2386"
          x1={5.35792}
          y1={60.852}
          x2={-1.0554}
          y2={68.3716}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#D14F4F" />
          <Stop offset={0.6} stopColor="#991E1E" />
          <Stop offset={1} stopColor="#F7BA2F" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

export default SwordIcon
