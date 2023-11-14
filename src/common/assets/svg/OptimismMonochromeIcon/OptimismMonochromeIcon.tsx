import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const OptimismMonochromeIcon: React.FC<Props> = ({ width = 18, height = 17.9, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 17.891 17.89" {...rest}>
    <Path
      d="M8.948 17.89A8.956 8.956 0 0 1 0 8.947 8.958 8.958 0 0 1 8.948 0a8.955 8.955 0 0 1 8.942 8.947 8.953 8.953 0 0 1-8.942 8.943ZM7.166 6.49a2.211 2.211 0 0 0-2.355 1.846c-.1.431-.189.822-.252 1.163a2.44 2.44 0 0 0-.033.36 1.275 1.275 0 0 0 .506 1.088 2.142 2.142 0 0 0 1.31.379 2.439 2.439 0 0 0 1.541-.45 2.482 2.482 0 0 0 .814-1.377c.091-.363.171-.754.24-1.163a2.575 2.575 0 0 0 .033-.356 1.349 1.349 0 0 0-.236-.8 1.359 1.359 0 0 0-.641-.51 2.364 2.364 0 0 0-.927-.18Zm3.105.068a.191.191 0 0 0-.127.049.2.2 0 0 0-.076.12l-.926 4.363a.162.162 0 0 0 .022.12.135.135 0 0 0 .112.049h.912a.2.2 0 0 0 .131-.049.189.189 0 0 0 .071-.12l.312-1.471h.9a2.328 2.328 0 0 0 1.384-.368 1.822 1.822 0 0 0 .676-1.144 1.45 1.45 0 0 0 .041-.349 1.017 1.017 0 0 0-.454-.893 2.082 2.082 0 0 0-1.2-.308Zm-3.838 3.8a.56.56 0 0 1-.645-.619 1.484 1.484 0 0 1 .025-.281c.074-.4.154-.772.241-1.1a1.251 1.251 0 0 1 .378-.679.965.965 0 0 1 .642-.221c.43 0 .638.2.638.612a1.567 1.567 0 0 1-.025.289c-.053.312-.13.671-.233 1.1a1.288 1.288 0 0 1-.383.679.965.965 0 0 1-.637.22Zm5.222-1.666h-.772l.256-1.2h.807a.55.55 0 0 1 .386.105.367.367 0 0 1 .116.3 1.537 1.537 0 0 1-.019.2.716.716 0 0 1-.285.443.8.8 0 0 1-.489.152Z"
      fill="#51588c"
    />
  </Svg>
)

export default OptimismMonochromeIcon
