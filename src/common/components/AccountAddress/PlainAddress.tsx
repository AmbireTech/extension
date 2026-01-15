import { FC } from 'react'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'

interface Props {
  maxLength: number
  address: string
  style?: any
  hideParentheses?: boolean
  fontSize?: number
}

const PlainAddress: FC<Props> = ({ style, maxLength, address, hideParentheses, fontSize = 12 }) => (
  <Text fontSize={fontSize} appearance="secondaryText" style={[spacings.mrMi, style]}>
    {hideParentheses ? '' : '('}
    {shortenAddress(address, maxLength)}
    {hideParentheses ? '' : ')'}
  </Text>
)

export default PlainAddress
