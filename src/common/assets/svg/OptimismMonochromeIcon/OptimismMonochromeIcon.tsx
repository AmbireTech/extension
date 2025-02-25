import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const OptimismMonochromeIcon: React.FC<Props> = ({ width = 17.9, height = 17.9, ...rest }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 17.89 17.89"
    {...rest}
  >
    <G data-name="OP Mainnet inactive icon new">
      <Path
        data-name="Path 17766"
        d="M8.945 0a8.945 8.945 0 108.945 8.945A8.945 8.945 0 008.945 0zm0 13.5v3.735a6.422 6.422 0 010-12.844V.655a6.422 6.422 0 110 12.844zm3.08-4.583v.057a6.626 6.626 0 00-3.051 3.051h-.058a6.626 6.626 0 00-3.051-3.051v-.058a6.626 6.626 0 003.051-3.051h.057a6.626 6.626 0 003.052 3.051z"
        transform="translate(24051 11218) translate(-24051 -11218)"
        fill="#51588c"
      />
    </G>
  </Svg>
)

export default OptimismMonochromeIcon
