import React from 'react'
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const RewardBadgeCryptoTesters: React.FC<Props> = ({
  width = 82.074,
  height = 93.633,
  ...rest
}) => (
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
        d="M546.467 417.165a32.041 32.041 0 01-32.037-32.037V360.32a9.368 9.368 0 016.228-8.816l23.055-7.668a8.732 8.732 0 015.508 0l23.072 7.673a9.363 9.363 0 016.211 8.811v24.809a32.041 32.041 0 01-32.037 32.037z"
        transform="translate(-505.43 -342.53)"
        fill="url(#b)"
      />
    </G>
    <Path
      d="M546.467 417.165a32.041 32.041 0 01-32.037-32.037V360.32a9.368 9.368 0 016.228-8.816l23.055-7.668a8.732 8.732 0 015.508 0l23.072 7.673a9.363 9.363 0 016.211 8.811v24.809a32.041 32.041 0 01-32.037 32.037z"
      transform="translate(8.137) translate(-513.567 -342.533)"
      fill="url(#b)"
    />
    <Path
      d="M545.82 343.6a8 8 0 012.485.4l23.055 7.668a8.508 8.508 0 015.639 8v24.809a31.18 31.18 0 11-62.359 0v-24.8a8.519 8.519 0 015.645-8L543.34 344a7.907 7.907 0 012.48-.4m0-1.714a9.632 9.632 0 00-3.028.491l-23.072 7.673a10.216 10.216 0 00-6.8 9.622v24.809a32.9 32.9 0 0014.77 27.454 32.885 32.885 0 0036.248 0 32.9 32.9 0 0014.77-27.454v-24.804a10.21 10.21 0 00-6.8-9.622l-23.072-7.673a9.56 9.56 0 00-3.017-.491z"
      transform="translate(8.137) translate(-513.001 -341.89)"
      fill="#6770b3"
    />
    <Path
      d="M3.75 0h1.58L3.49-2.78l1.82-2.76h-1.5L2.79-3.83 1.66-5.54H.08l1.83 2.76L.1 0h1.5l1.01-1.72zm2.98 0h1.44v-7.29H5.76V-6h.97zm4.45-.75a.818.818 0 00-.85-.82.824.824 0 00-.87.82.824.824 0 00.87.82.818.818 0 00.85-.82zm.89.65h4.94v-1.16h-2.95c1.16-.98 2.79-2.3 2.79-3.99a2.105 2.105 0 00-2.36-2.2 2.292 2.292 0 00-2.43 2.44h1.36c.01-.77.38-1.25 1.05-1.25.69 0 .98.44.98 1.09 0 1.34-1.73 2.63-3.38 4.03zm6.2-7.21v4.28h1.34a1.09 1.09 0 011.1-.77 1.108 1.108 0 011.2 1.27c0 .77-.37 1.35-1.19 1.35a1.14 1.14 0 01-1.21-.88h-1.36A2.323 2.323 0 0020.74 0a2.34 2.34 0 002.52-2.55 2.194 2.194 0 00-2.28-2.41 1.9 1.9 0 00-1.43.59v-1.71h3.24v-1.23z"
      transform="translate(8.137) translate(20.62 56.141) translate(.299 9.859)"
      fill="#ebecff"
    />
    <G fill="#24263d">
      <Path
        d="M565.409 364.013c5.034 0 9.29 9.113 9.29 19.907a35.856 35.856 0 01-1.994 12.142c.383.086.766.16 1.143.229a37.029 37.029 0 001.994-12.37c0-11.622-4.668-21.049-10.433-21.049-2.794 0-5.325 2.217-7.2 5.822.383.08.766.166 1.148.263 1.643-3.064 3.767-4.944 6.052-4.944z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(10.515) translate(-554.976 -362.87)"
      />
      <Path
        d="M569.613 420.024c-1.651 3.16-3.811 5.108-6.136 5.108-3.663 0-6.914-4.828-8.411-11.616-.463-.3-.92-.617-1.366-.926 1.48 7.993 5.3 13.684 9.776 13.684 2.834 0 5.405-2.285 7.285-5.994q-.561-.111-1.148-.256z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(10.515) translate(-553.043 -384.181)"
      />
      <Path
        d="M555.171 381.744a29.731 29.731 0 011.114-3.76 21.276 21.276 0 00-1.143-.234 31.663 31.663 0 00-1.343 4.925 40.59 40.59 0 011.372-.931z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(10.515) translate(0 8.502) translate(-553.086 -377.75)"
      />
      <Path
        d="M553.961 391.65c-.428.32-.846.64-1.251.971a41.523 41.523 0 00-.023 7.034c.406.326.817.64 1.245.96a39.677 39.677 0 01.029-8.965z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(10.515) translate(0 8.502) translate(-552.55 -383.708)"
      />
      <Path
        d="M563.6 420c-1.206.446-2.4.817-3.56 1.12.149.366.308.72.469 1.057a41.152 41.152 0 004.531-1.5c-.486-.22-.966-.443-1.44-.677z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(0 6.062) translate(-545.245 -393.42)"
      />
      <Path
        d="M579.5 410.4a52.492 52.492 0 01-3.24 2.046 50.272 50.272 0 01-3.714 1.937c.48.2.96.394 1.434.571.948-.469 1.9-.971 2.845-1.52q1.234-.711 2.388-1.468c.114-.515.205-1.04.287-1.566z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(0 6.062) translate(-550.607 -389.305)"
      />
      <Path
        d="M597.275 376.708c-1.257-2.171-4.039-3.228-7.685-3.228a23.588 23.588 0 00-3.96.36c.16.349.314.714.463 1.08a22.393 22.393 0 013.5-.3c3.331 0 5.708.943 6.7 2.657 1.171 2.034.417 5.211-2.074 8.719a32.882 32.882 0 01-5.925 6.2q-.069.806-.171 1.594c7.586-5.929 11.557-12.916 9.152-17.082z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(0 6.062) translate(-556.214 -373.48)"
      />
      <Path
        d="M574.064 377.4a38.505 38.505 0 013.588-1.131c-.154-.36-.308-.714-.474-1.051a40 40 0 00-4.548 1.514c.48.214.96.436 1.434.668z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(0 6.062) translate(-550.641 -374.226)"
      />
      <Path
        d="M550.261 383.174a49.306 49.306 0 013.72-1.937 43.008 43.008 0 00-1.445-.577q-1.423.7-2.851 1.526c-11.142 6.434-17.787 15.793-14.838 20.9 1.257 2.171 4.039 3.228 7.685 3.228a24.136 24.136 0 004-.366c-.154-.349-.3-.709-.451-1.08a22.374 22.374 0 01-3.548.3c-3.331 0-5.708-.943-6.7-2.657-1.171-2.034-.417-5.211 2.074-8.719a39.541 39.541 0 0112.354-10.618z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(0 6.062) translate(-534.146 -376.558)"
      />
      <Path
        d="M538.512 386.789a18.36 18.36 0 01-.594-.8c-2.491-3.508-3.251-6.691-2.074-8.719.989-1.714 3.365-2.657 6.7-2.657 4.948 0 11.239 1.994 17.261 5.474q1.663.96 3.205 2.017a35.59 35.59 0 00-.3-1.571 49.375 49.375 0 00-2.331-1.434 45.407 45.407 0 00-11.279-4.709l-.257-.063a45.835 45.835 0 00-1.12-.257l-.4-.086a24.882 24.882 0 00-4.782-.514c-3.645 0-6.434 1.057-7.685 3.228-1.606 2.783-.366 6.822 2.891 10.965.253-.292.502-.583.765-.874z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(.006 6.057) translate(-534.156 -373.47)"
      />
      <Path
        d="M576.44 400.67c-.246.292-.5.577-.766.869.206.269.411.537.6.811 2.491 3.508 3.251 6.691 2.074 8.719-.988 1.714-3.365 2.657-6.7 2.657a22.784 22.784 0 01-3.428-.286v.006l-.154-.029a26.597 26.597 0 01-1.771-.343l-.92-.206.006-.011a44.4 44.4 0 01-10.993-4.6 43.789 43.789 0 01-9.868-7.628c-.257.291-.509.577-.743.868a45.017 45.017 0 0010.039 7.748c6.405 3.7 12.907 5.628 17.832 5.628 3.646 0 6.434-1.057 7.685-3.228 1.609-2.787.367-6.827-2.893-10.975z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(.006 6.057) translate(-538.281 -385.112)"
      />
      <Path
        d="M589.95 389.98q.1.789.171 1.594a37.025 37.025 0 013.462 3.217c.257-.291.5-.583.743-.874a40.31 40.31 0 00-4.376-3.937z"
        transform="translate(8.137) translate(11.181 11.987) translate(.946) translate(.006 6.057) translate(-558.071 -380.547)"
      />
    </G>
    <G transform="translate(8.137) translate(11.181 11.987) translate(16.078 15.187)">
      <Circle cx={5.777} cy={5.777} r={5.777} fill="#904dff" />
      <Path
        d="M568.346 399.862a5.772 5.772 0 01-4.571-9.3 6.029 6.029 0 00-2.845 4.76c0 3.194 1.766 5.805 6.091 5.805a5.757 5.757 0 004.571-2.257 5.777 5.777 0 01-3.246.992z"
        transform="translate(-560.759 -389.926)"
        fill="#6000ff"
      />
      <Path
        d="M570.994 390.03a4.525 4.525 0 00-.56.04 3.612 3.612 0 005.131 5.079 5.149 5.149 0 00.029-.514 4.6 4.6 0 00-4.6-4.605z"
        transform="translate(-564.423 -389.699)"
        fill="#cca4ff"
      />
      <Circle cx={5.777} cy={5.777} r={5.777} fill="none" stroke="#24263d" strokeWidth={1.5} />
    </G>
    <G transform="translate(8.137) translate(11.181 11.987) translate(30.757 3.097)">
      <Circle cx={3.085} cy={3.085} r={3.085} transform="translate(0 .12)" fill="#27e8a7" />
      <Path
        d="M590.721 373.665a3.087 3.087 0 01-3.086-3.085 3.042 3.042 0 01.646-1.88 3.211 3.211 0 00-1.491 2.554c0 1.7.863 3.085 3.223 3.085a3.069 3.069 0 002.44-1.206 3.07 3.07 0 01-1.732.532z"
        transform="translate(-586.521 -368.466)"
        fill="#007d8a"
      />
      <Path
        d="M591.736 368.82a2.514 2.514 0 00-.3.017 1.929 1.929 0 001.423 3.234 1.949 1.949 0 001.32-.52 2.211 2.211 0 00.017-.274 2.469 2.469 0 00-2.46-2.457z"
        transform="translate(-588.296 -368.517)"
        fill="#a9ffe0"
      />
      <Circle cx={3.085} cy={3.085} r={3.085} fill="none" stroke="#24263d" strokeWidth={1} />
    </G>
    <G transform="translate(8.137) translate(11.181 11.987) translate(23.769 35.528)">
      <Circle cx={3.085} cy={3.085} r={3.085} fill="#fd1a64" />
      <Path
        d="M578.508 430.435a3.087 3.087 0 01-3.085-3.085 3.043 3.043 0 01.646-1.88 3.2 3.2 0 00-1.468 2.56 2.793 2.793 0 003.2 3.08 3.154 3.154 0 002.44-1.206 3.069 3.069 0 01-1.733.531z"
        transform="translate(-574.309 -425.23)"
        fill="#bf1057"
      />
      <Path
        d="M579.506 425.58a2.512 2.512 0 00-.3.017 1.929 1.929 0 001.423 3.234 1.949 1.949 0 001.32-.52 2.211 2.211 0 00.017-.274 2.473 2.473 0 00-2.46-2.457z"
        transform="translate(-576.066 -425.277)"
        fill="#f97aa1"
      />
      <Circle cx={3.085} cy={3.085} r={3.085} fill="none" stroke="#24263d" strokeWidth={1} />
    </G>
    <G transform="translate(8.137) translate(11.181 11.987) translate(0 13.993)">
      <Circle cx={3.085} cy={3.085} r={3.085} fill="#ffbc00" />
      <Path
        d="M536.915 392.735a3.087 3.087 0 01-3.085-3.085 3.042 3.042 0 01.646-1.88 3.155 3.155 0 00-1.446 2.548c0 1.885.948 3.091 3.177 3.091a3.069 3.069 0 002.44-1.206 3.056 3.056 0 01-1.732.532z"
        transform="translate(-532.721 -387.536)"
        fill="#b78404"
      />
      <Path
        d="M537.9 387.89a2.511 2.511 0 00-.3.017 1.929 1.929 0 001.423 3.234 1.949 1.949 0 001.32-.52 2.2 2.2 0 00.017-.274 2.462 2.462 0 00-2.46-2.457z"
        transform="translate(-534.462 -387.587)"
        fill="#fce19d"
      />
      <Circle cx={3.085} cy={3.085} r={3.085} fill="none" stroke="#24263d" strokeWidth={1} />
    </G>
  </Svg>
)

export default RewardBadgeCryptoTesters
