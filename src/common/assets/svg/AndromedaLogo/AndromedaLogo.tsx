import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

interface Props extends SvgProps {
  width?: number
  height?: number
}

const AndromedaLogo: React.FC<Props> = ({ width = 32, height = 32, ...rest }) => (
  <Svg width={width} height={height} viewBox="0 0 32 32" {...rest}>
    <Path
      d="M12.764 22.673a10.394 10.394 0 0 0 .4-1 .6.6 0 0 0-.1-.4 3.114 3.114 0 0 1-.6-2.605c0-.1 0-.2.1-.2 0-.1.1-.1.1-.2a3.953 3.953 0 0 1 1 2.5c.2-.4.5-.8.7-1.3 0-.1-.1-.2-.1-.3a3.18 3.18 0 0 1-.3-3.006 3.382 3.382 0 0 1 .9 2.5 10.5 10.5 0 0 1 .8-1.1.368.368 0 0 0-.1-.3 3.218 3.218 0 0 1 .2-2.705c.1-.1.1-.2.2-.3a3.392 3.392 0 0 1 .3 2.4h.1a3.515 3.515 0 0 0 .5-.8 3.858 3.858 0 0 1 2.1-2.4c.2-.1.3-.1.5-.2a.9.9 0 0 1-.1.5 3.783 3.783 0 0 1-2 2.3 1.966 1.966 0 0 0-.9.9 3.317 3.317 0 0 1 2.605-.3 1.759 1.759 0 0 1-.5.4 3.228 3.228 0 0 1-2.3.6c-.3 0-.4 0-.5.2a10.929 10.929 0 0 0-.6 1.1 3.072 3.072 0 0 1 2.805-.1c-.3.2-.5.4-.7.5a3.309 3.309 0 0 1-2.2.2c-.2-.1-.3 0-.4.2-.2.4-.4.8-.7 1.3a3.437 3.437 0 0 1 2.805-.3l.1.1c-.1.1-.2.1-.4.2a3.752 3.752 0 0 1-2.5.6c-.2-.1-.4 0-.4.2-.3.8-.6 1.6-.9 2.3a4.061 4.061 0 0 1-.5.9.366.366 0 0 1-.5.2 9.7 9.7 0 0 1-5.31-6.412 9.821 9.821 0 0 1 6.696-12.104 9.952 9.952 0 0 1 6.412 18.837c-.3.1-.5.2-.7 0a.784.784 0 0 1-.1-.8c.4-1 .7-2 1-3.006.2-.6.4-.8 1-.8.6-.1 1.2-.1 1.8-.2.5-.1.7-.3.7-.8v-.4c-.1-.2 0-.4.2-.6s.2-.3 0-.5c-.1-.1-.1-.3 0-.3a.376.376 0 0 0 0-.6c-.2-.2-.1-.4.1-.5a.782.782 0 0 0 .4-.4c.3-.2.2-.4 0-.6-.4-.4-.9-.7-1.3-1.1a.808.808 0 0 1-.3-.9 2.227 2.227 0 0 0-.3-1.6 8.282 8.282 0 0 1-.7-1.3 2.322 2.322 0 0 0-1.5-1.4 14.373 14.373 0 0 0-2.2-.4c-.5-.1-1-.1-1.5-.2a4.1 4.1 0 0 0-3.507 1 3.335 3.335 0 0 1-1 .6c-.3.1-.5.4-.7.6a.9.9 0 0 1-.6.6 8.079 8.079 0 0 0-1.4 1.2c-.1.2-.4.3-.5.4a1.053 1.053 0 0 0-.5 1.4 2.467 2.467 0 0 1 .1 1.2 1.707 1.707 0 0 0 0 1 .962.962 0 0 0 .7.9.635.635 0 0 1 .5.6 2.388 2.388 0 0 0 .6 1.1 4.137 4.137 0 0 1 .7 1.1 1.654 1.654 0 0 0 1 1 6.044 6.044 0 0 1 1.294.801Z"
      fill="#00dacc"
    />
  </Svg>
)

export default AndromedaLogo
