import React, { FC } from 'react'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import HighlightedPlainAddress from '@common/components/AccountAddress/HighlightedPlainAddress'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'

interface Props {
  maxLength: number
  address: string
  style?: any
  hideParentheses?: boolean
  fontSize?: number
  withWrap?: boolean
  highlight?: {
    prefix: number
    suffix: number
    color: 'errorText'
  }
}

const PlainAddress: FC<Props> = ({
  style,
  maxLength,
  address,
  hideParentheses,
  fontSize = 12,
  withWrap = false,
  highlight
}) => {
  if (highlight) {
    return (
      <HighlightedPlainAddress
        address={address}
        highlight={highlight}
        hideParentheses={hideParentheses}
        fontSize={fontSize}
        style={style}
        withWrap={withWrap}
      />
    )
  }

  return (
    <Text
      fontSize={fontSize}
      appearance="secondaryText"
      weight="mono_regular"
      style={[spacings.mrMi, style]}
      numberOfLines={1}
      ellipsizeMode={isMobile ? 'middle' : undefined}
    >
      {hideParentheses ? '' : '('}
      {shortenAddress(address, maxLength)}
      {hideParentheses ? '' : ')'}
    </Text>
  )
}

export default React.memo(PlainAddress)
