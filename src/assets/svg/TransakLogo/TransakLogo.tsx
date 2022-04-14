import React from 'react'
import Svg, { Defs, G, LinearGradient, Path, Stop, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const TransakLogo: React.FC<Props> = ({ width = 90, height = 23.7 }) => (
  <Svg width={width} height={height} viewBox="0 0 90 23.776">
    <Defs>
      <LinearGradient id="b" x1="-.033" x2="1.038" y1="-.012" y2="0.807">
        <Stop stopColor="#3495f7" offset="0.13" />
        <Stop stopColor="#2b87f2" offset="0.306" />
        <Stop stopColor="#1461e5" offset="0.639" />
        <Stop stopColor="#0e57e1" offset="0.723" />
      </LinearGradient>
      <LinearGradient id="a" y1="0.5" y2="0.5">
        <Stop stopColor="#3495f7" offset="0" />
        <Stop stopColor="#1461e5" offset="0.494" />
        <Stop stopColor="#0e57e1" offset="1" />
      </LinearGradient>
    </Defs>
    <G transform="translate(-135.5 -161.7)" data-name="transak logo">
      <G transform="translate(135.5 161.7)">
        <Path
          transform="translate(-135.5 -161.7)"
          d="m156.9 185.48h-19.423a1.976 1.976 0 0 1-1.977-1.977v-19.823a1.976 1.976 0 0 1 1.977-1.977h19.43a1.976 1.976 0 0 1 1.977 1.977v19.823a1.98 1.98 0 0 1-1.984 1.977z"
          fill="url(#b)"
          data-name="Path 120"
        />
        <Path
          transform="translate(-403.59 -437.2)"
          d="m426.97 451.6v7.4a1.976 1.976 0 0 1-1.973 1.973h-7.4z"
          fill="#2970e2"
          data-name="Path 121"
        />
        <G transform="translate(2.458 6.631)" data-name="Group 93">
          <G transform="translate(4.019)" data-name="Group 88">
            <G transform="translate(.331 .128)" data-name="Group 85">
              <Path
                transform="translate(-272.57 -297.78)"
                d="M273.6,305.328l6.9-7.172a1.327,1.327,0,0,1,1.9.06l3.988,3.844a1.259,1.259,0,0,1,.02,1.644c-.512.512-1.088.546-1.863.02l-2.891-3.129-7.267,6.909a1.316,1.316,0,0,1-1.748.2c-.263-.353.258-1.043.055-1.247Z"
                fill="#d1d9e6"
                data-name="Path 122"
              />
            </G>
            <G data-name="Group 86">
              <Path
                transform="translate(-265.9 -295.2)"
                d="M266.953,305.283a.992.992,0,0,1-1.053-.859l.035-8.2a1.071,1.071,0,0,1,2.141.084v8.136A1,1,0,0,1,266.953,305.283Z"
                fill="#d1d9e6"
                data-name="Path 123"
              />
            </G>
            <G transform="translate(8.061 .859)" data-name="Group 87">
              <Path
                transform="translate(-428.2 -312.49)"
                d="m429.24 321.94a0.972 0.972 0 0 1-1.038-0.969v-7.52a1.087 1.087 0 0 1 2.156-0.02v7.435a1.051 1.051 0 0 1-1.118 1.074z"
                fill="#d1d9e6"
                data-name="Path 124"
              />
            </G>
          </G>
          <G transform="translate(0 .089)" data-name="Group 92">
            <G transform="translate(4.019)" data-name="Group 89">
              <Path
                transform="translate(-265.9 -296.99)"
                d="M266.7,307.073a.853.853,0,0,1-.8-.859v-8.2a1.023,1.023,0,0,1,.8-1.023c.472-.02.869.526.869,1v8.245A.835.835,0,0,1,266.7,307.073Z"
                fill="#fff"
                data-name="Path 125"
              />
            </G>
            <G transform="translate(12.05 .249)" data-name="Group 90">
              <Path
                transform="translate(-427.6 -302)"
                d="m428.44 311.92a0.994 0.994 0 0 1-0.839-1v-8.076a0.839 0.839 0 1 1 1.679 0v8.081a1 1 0 0 1-0.84 0.995z"
                fill="#fff"
                data-name="Path 126"
              />
            </G>
            <G transform="translate(0 .199)" data-name="Group 91">
              <Path
                transform="translate(-184.99 -300.99)"
                d="m189.85 310.79a1.045 1.045 0 0 1-0.75-0.313l-3.8-3.81a1.064 1.064 0 0 1 1.51-1.5l3.06 3.079 7.321-6.969a1.06 1.06 0 0 1 1.47 0l3.983 3.844a1.064 1.064 0 0 1-1.475 1.535l-3.253-3.134-7.336 6.969a1.059 1.059 0 0 1-0.73 0.299z"
                fill="#fff"
                data-name="Path 127"
              />
            </G>
          </G>
          <Path
            transform="translate(-402.36 -358.49)"
            d="M414.514,362.644l-.462.437s.129-.73-.243-.377.576-.9.576-.9l.194.243Z"
            fill="#fff"
            data-name="Path 128"
          />
          <Path
            transform="translate(-447.29 -361.91)"
            d="M461.015,365.956s.025-.447.512.318v-.6L461,365.4Z"
            fill="#fff"
            data-name="Path 129"
          />
          <Path
            transform="translate(-293.62 -410.28)"
            d="M299.32,416.444s.07.5.507-.144v.6l-.526.273Z"
            fill="#fff"
            data-name="Path 130"
          />
        </G>
      </G>
      <Path
        transform="translate(-548.15 -163.74)"
        d="M717.118,334.164l.1.035c.015.283.025.815.025,1.594,0,.05-.074.07-.223.07H716c-.094,0-.144.074-.144.224v6.1c0,.01-.02.025-.06.055a.151.151,0,0,1-.084.04H713.85l-.084-.07q-.037-.037-.035-5.558v-.735q-1.43,0-1.43-.179v-1.515c0-.01.03-.03.094-.07h2.126c.109.015.179.03.2.035s.035-.01.035-.035h2.364Zm2.92-.02h3.273a2.781,2.781,0,0,1,1.982.82,2.623,2.623,0,0,1,.859,1.957,2.444,2.444,0,0,1-.5,1.535,3.2,3.2,0,0,1-1.356,1c-.025,0-.035.02-.035.06v.01a.027.027,0,0,1,.01.025l2.021,2.469a1.076,1.076,0,0,1,.07.129.551.551,0,0,0,.055.1.272.272,0,0,1,.02.04c0,.025-.129.045-.392.065s-.432.03-.522.03a.175.175,0,0,1-.129-.035h-1.267a.273.273,0,0,1-.2-.129l-1.644-1.937c-.01-.01-.025-.03-.05-.06a.459.459,0,0,0-.07-.07.148.148,0,0,0-.07-.025c-.015,0-.035.05-.06.154V342.2c0,.065-.025.094-.07.094h-1.609c-.144,0-.238-.03-.283-.094a.634.634,0,0,1-.094-.318c0-.7.005-1.589.02-2.667s.02-1.887.02-2.429c0-.084,0-.4-.01-.944l-.025-.815A6.845,6.845,0,0,1,720.038,334.144Zm3.984,2.752a1.082,1.082,0,0,0-.154-.581,1.366,1.366,0,0,0-1.232-.462c-.109,0-.278.01-.5.025l-.1.119c0,.1,0,.263-.01.477s-.015.4-.02.551,0,.258,0,.318c0,.526.05.825.144.889h.129a2.766,2.766,0,0,0,1.366-.273C723.9,337.795,724.022,337.442,724.022,336.9Zm7.674-2.846H733.1c.04,0,.154.219.338.651a5.168,5.168,0,0,1,.278.72q.246.648,2.682,6.606a.2.2,0,0,1-.144.209,2.081,2.081,0,0,1-.522.04l-.6-.01c-.4-.01-.705-.01-.909-.01-.015-.05-.05-.129-.094-.248s-.084-.209-.114-.273-.07-.144-.124-.238a1.984,1.984,0,0,0-.179-.258c-.055,0-.164-.01-.333-.03a3.745,3.745,0,0,0-.447-.03l-1.48.025c-.025,0-.094,0-.214-.01s-.184-.01-.189-.01c-.144,0-.263.184-.367.556a1.465,1.465,0,0,1-.258.626,7.436,7.436,0,0,1-.785-.02c-.313-.02-.571-.03-.785-.03-.333,0-.5-.05-.5-.144a.286.286,0,0,1,0-.06.229.229,0,0,0,0-.05l.685-1.987a7.849,7.849,0,0,0,.373-.924c.144-.407.238-.661.278-.755.159-.407.427-1.093.81-2.046s.67-1.689.869-2.21C731.4,334.079,731.5,334.05,731.7,334.05Zm.119,5.518h.308c.566-.015.849-.05.849-.094a4.286,4.286,0,0,0-.368-1.078c-.094-.228-.149-.353-.164-.378l-.154-.368a2.979,2.979,0,0,0-.4.815,4.805,4.805,0,0,0-.338.959C731.552,339.518,731.641,339.568,731.815,339.568Zm14.056-.983c0,.015,0,.05-.01.1s-.015.109-.025.164l-.01.07c0,.338.01.849.025,1.525s.025,1.182.025,1.515c0,.228-.05.343-.144.343H744.2a.306.306,0,0,1-.273-.129L742.469,340a.578.578,0,0,0-.1-.154.464.464,0,0,1-.094-.119L741.078,338l-.144-.154-.025.05a34.642,34.642,0,0,1-.1,4.386h-1.868l-.07-.035q0-.909.025-3.129c.015-1.48.025-2.573.025-3.293,0-.541-.01-.954-.025-1.232l.05-.343.238-.05,1.49.05c.04,0,.085.04.144.119a.842.842,0,0,1,.1.189l1.113,1.609a1,1,0,0,0,.089.134,1.011,1.011,0,0,1,.089.134l1.525,2.091c.025.055.055.084.094.084s.035-.01.035-.035v-4.267l.07-.06a4.123,4.123,0,0,1,.507-.01,7.238,7.238,0,0,1,1.4.05l.05.07v4.222Zm6.214,1.1a2.876,2.876,0,0,0-.457-.363c-.184-.124-.4-.253-.641-.392s-.387-.228-.442-.268a2.77,2.77,0,0,1-1.525-2.339,1.955,1.955,0,0,1,.8-1.714,3.541,3.541,0,0,1,2.081-.566,3.756,3.756,0,0,1,1.406.283,4.239,4.239,0,0,1,.417.189c.194.094.288.164.288.2l-.01.06c0,.01-.01.02-.025.04a.1.1,0,0,0-.025.055,8.236,8.236,0,0,1-.71,1.232.056.056,0,0,1-.06.035,4.276,4.276,0,0,1-.541-.194,2.316,2.316,0,0,0-.77-.194.911.911,0,0,0-.487.144.44.44,0,0,0-.224.392.789.789,0,0,0,.353.6c.159.119.472.328.944.626.1.07.238.164.4.278l.392.273c.094.065.2.149.318.248a2.022,2.022,0,0,1,.293.288,1.934,1.934,0,0,1,.482,1.381,2.292,2.292,0,0,1-.839,1.828,2.985,2.985,0,0,1-2,.715,4.8,4.8,0,0,1-2.374-.616c-.333-.2-.5-.328-.5-.368v-.05c.348-.631.636-1.118.864-1.465a.67.67,0,0,1,.382.164,2.222,2.222,0,0,0,.253.179,3.1,3.1,0,0,0,1.43.318c.467,0,.7-.174.7-.522A.67.67,0,0,0,752.085,339.687Zm7.838-5.637h1.406c.04,0,.154.219.338.651a5.168,5.168,0,0,1,.278.72q.246.648,2.682,6.606a.2.2,0,0,1-.144.209,2.081,2.081,0,0,1-.522.04l-.6-.01c-.4-.01-.705-.01-.909-.01-.015-.05-.05-.129-.094-.248s-.084-.209-.114-.273-.07-.144-.124-.238a1.978,1.978,0,0,0-.179-.258c-.055,0-.164-.01-.333-.03a3.744,3.744,0,0,0-.447-.03l-1.48.025c-.025,0-.094,0-.214-.01s-.184-.01-.189-.01c-.144,0-.263.184-.368.556a1.466,1.466,0,0,1-.258.626,7.437,7.437,0,0,1-.785-.02c-.313-.02-.571-.03-.785-.03-.333,0-.5-.05-.5-.144a.283.283,0,0,1,.005-.06.229.229,0,0,0,0-.05l.685-1.987a7.851,7.851,0,0,0,.372-.924c.144-.407.238-.661.278-.755.159-.407.427-1.093.81-2.046s.671-1.689.869-2.21Q759.632,334.05,759.922,334.05Zm.119,5.518h.308c.566-.015.849-.05.849-.094a4.286,4.286,0,0,0-.368-1.078c-.094-.228-.149-.353-.164-.378l-.154-.368a2.978,2.978,0,0,0-.4.815,4.808,4.808,0,0,0-.338.959C759.783,339.518,759.868,339.568,760.042,339.568ZM768.863,334c.243,0,.367.045.367.129v2.414c0,.079.01.119.025.119.055,0,.124-.05.209-.154a4.205,4.205,0,0,0,.253-.348,1.379,1.379,0,0,1,.2-.253l1.326-1.8a.2.2,0,0,1,.164-.07h1.748l.283.05c.015,0,.025.015.025.05a.157.157,0,0,1-.025.1l-.507.8-.07.05-1.515,2.022a.124.124,0,0,0-.035.094.269.269,0,0,0,.035.144l2.295,4.738v.035l.01.035c0,.134-.238.2-.71.2-.278,0-.6-.01-.964-.035s-.571-.035-.611-.035l-.084-.06c-.05-.05-.487-.959-1.326-2.732a1.61,1.61,0,0,0-.164-.377c-.025,0-.114.109-.278.333a3.643,3.643,0,0,0-.268.392c0,.144,0,.373.005.685s0,.611,0,.884c0,.561-.065.849-.189.874-.159,0-.353,0-.591.02s-.4.02-.487.02a3.723,3.723,0,0,1-.541-.05c-.229-.03-.343-.06-.343-.084v-4.068c.05-.377.07-.6.07-.651,0-.353-.015-.884-.05-1.594s-.05-1.237-.05-1.584c0-.144.03-.228.094-.258C767.586,334.01,768.143,334,768.863,334Z"
        fill="url(#a)"
        data-name="Path 131"
      />
    </G>
  </Svg>
)

export default TransakLogo
