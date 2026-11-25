import React, { useId } from 'react'
import Svg, {
  Defs,
  FeColorMatrix,
  FeComposite,
  FeFlood,
  FeGaussianBlur,
  FeMerge,
  FeMergeNode,
  FeOffset,
  Filter,
  G,
  Path,
  SvgProps
} from 'react-native-svg'

/**
 * The design's shield is 26x28.69 at (7, 6.4) in the 40x40 avatar. Its paths leave 4 on the sides
 * and 1 above it for the shadow, which goes 3 down and blurs 4 around.
 */
const SHIELD_OFFSET = 'translate(3 5.3964)'
const SHADOW_WIDTH = 34
const SHADOW_HEIGHT = 36.6943

/**
 * A see-through shield with a white border and the Privacy Pools logo inside, drawn over the
 * avatar image of the Privacy Pools accounts. Drawn in the avatar's own 40x40 frame, so it is as
 * big as the avatar. The avatar has the same colors in both themes, so this icon does too.
 */
const PrivacyPoolsAvatarShieldIcon: React.FC<SvgProps> = ({ width = 40, height = 40, ...rest }) => {
  const shadowId = useId().replaceAll(':', '')

  return (
    <Svg width={width} height={height} viewBox="0 0 40 40" fill="none" {...rest}>
      <Defs>
        {/* The design's orange shadow, only outside the shield, so it doesn't darken it through
        its see-through fill */}
        <Filter
          id={shadowId}
          x={0}
          y={0}
          width={SHADOW_WIDTH}
          height={SHADOW_HEIGHT}
          filterUnits="userSpaceOnUse"
        >
          {/* The whole shield as opaque, as its see-through fill casts the full shadow too */}
          <FeColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <FeOffset dy={3} />
          <FeGaussianBlur stdDeviation={2} />
          <FeComposite in2="hardAlpha" operator="out" result="shadowShape" />
          <FeFlood floodColor="#9D4401" floodOpacity={0.66} />
          <FeComposite in2="shadowShape" operator="in" />
          <FeMerge>
            <FeMergeNode />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>
      </Defs>
      <G transform={SHIELD_OFFSET}>
        <G filter={`url(#${shadowId})`}>
          <Path
            fill="#272727"
            fillOpacity={0.2}
            d="M17.8177 1.12601L28.7934 4.05288C29.2517 4.17507 29.5706 4.59009 29.5706 5.06436V17.648C29.5706 19.748 28.521 21.7092 26.7737 22.8742L17.5893 28.9971C17.2375 29.2315 16.7795 29.2315 16.4278 28.9971L7.2434 22.8742C5.49603 21.7092 4.44645 19.748 4.44645 17.648V5.06437C4.44645 4.59009 4.76531 4.17507 5.22356 4.05288L16.1993 1.12601C16.7295 0.984621 17.2875 0.984621 17.8177 1.12601Z"
          />
          <Path
            fill="#FFFFFF"
            fillOpacity={0.64}
            d="M17.8171 1.12606C19.2239 1.53734 20.6313 1.94692 22.039 2.35482C24.2689 3.00096 26.5 3.64285 28.7321 4.28052C29.077 4.3755 29.3241 4.71806 29.3107 5.06441C29.2397 9.25891 29.183 13.4535 29.1408 17.648C29.1325 19.5708 28.1058 21.4395 26.5061 22.4738C23.4308 24.4941 20.3617 26.5235 17.2987 28.5621C17.1279 28.6784 16.8878 28.678 16.7174 28.5616C16.6613 28.5241 16.605 28.4866 16.5487 28.4492C13.5435 26.4456 10.5324 24.451 7.51546 22.4652C5.91956 21.4313 4.89722 19.5656 4.89088 17.648C4.85224 13.4535 4.7993 9.25891 4.73205 5.06442C4.71924 4.72992 4.95801 4.39929 5.29088 4.30775C8.04844 3.52265 10.8043 2.73108 13.5584 1.93307C14.442 1.67705 15.3254 1.42036 16.2085 1.16301C16.726 1.01147 17.2865 0.997428 17.8171 1.12606C17.2933 0.972304 16.7256 0.958263 16.1889 1.08909C15.2947 1.3057 14.4009 1.52295 13.5071 1.74088C10.7214 2.42016 7.9373 3.1059 5.15497 3.79809C4.59312 3.93071 4.15844 4.47665 4.15959 5.06442C4.09234 9.25891 4.0394 13.4535 4.00076 17.648C3.96624 19.8575 5.11661 22.0513 6.97005 23.2833C9.96346 25.3043 12.9628 27.3166 15.968 29.3201C16.0243 29.3577 16.0805 29.3951 16.1368 29.4327C16.6483 29.7818 17.3676 29.7814 17.8786 29.4323C20.9385 27.3888 23.9924 25.3364 27.04 23.2746C28.8896 22.043 30.0355 19.8523 29.9992 17.648C29.9569 13.4535 29.9002 9.25891 29.8292 5.06441C29.8298 4.48848 29.4034 3.9545 28.8535 3.82532C26.6002 3.26687 24.3458 2.71263 22.0903 2.16264C20.6663 1.81543 19.242 1.46989 17.8171 1.12606Z"
          />
          <Path
            fill="#FFFFFF"
            d="M14.9487 6.9195C15.0716 6.9793 15.1307 7.12049 15.0854 7.24716L13.7376 11.0158L15.1332 13.5935L11.3473 15.6199C11.2825 15.6548 11.2049 15.6619 11.1341 15.6407C11.0635 15.6192 11.0041 15.57 10.9708 15.5055L10.129 13.8604C10.0855 13.7752 10.0913 13.6728 10.145 13.5935L14.6006 7.01136C14.6766 6.89987 14.8257 6.86022 14.9487 6.9195Z"
          />
          <Path
            fill="#FFFFFF"
            d="M21.7716 11.658C21.8958 11.6315 22.0229 11.693 22.077 11.8054L24.9681 17.7997C25.0172 17.9023 24.9946 18.0258 24.9114 18.1047L17.204 25.3923C17.1256 25.4662 17.008 25.4872 16.9075 25.4461C16.8066 25.4043 16.7388 25.3067 16.7387 25.1999V20.6911V18.2611L21.5585 13.9167V11.918C21.5585 11.7933 21.6469 11.6853 21.7716 11.658Z"
          />
          <Path
            fill="#FFFFFF"
            d="M16.89 3.93707C17.0175 3.91291 17.146 3.98094 17.1954 4.09828L20.4098 11.7377C20.4374 11.8038 20.4369 11.8784 20.408 11.944L15.2295 23.6987C15.1941 23.7782 15.1212 23.8372 15.0342 23.8546C14.9469 23.872 14.8554 23.8451 14.7908 23.7853L9.91423 19.261C9.81465 19.1685 9.80077 19.0171 9.8823 18.9091L16.6343 9.98691L16.6697 4.19709L16.6857 4.10694C16.7179 4.0215 16.7942 3.95531 16.89 3.93707Z"
          />
        </G>
      </G>
    </Svg>
  )
}

export default React.memo(PrivacyPoolsAvatarShieldIcon)
