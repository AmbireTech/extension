import React, { FC } from 'react'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import HighlightedPlainAddress from '@common/components/AccountAddress/HighlightedPlainAddress'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
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
  const shouldShowFullAddressOnWeb = isWeb && maxLength >= 42

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
      style={[
        spacings.mrMi,
        style,
        shouldShowFullAddressOnWeb && {
          flex: 1,
          flexShrink: 1,
          minWidth: 0,
          // @ts-ignore web-only style for wrapping long hex addresses
          wordBreak: 'break-all'
        }
      ]}
      numberOfLines={shouldShowFullAddressOnWeb ? undefined : 1}
      ellipsizeMode={isMobile ? 'middle' : undefined}
    >
      {hideParentheses ? '' : '('}
      {shouldShowFullAddressOnWeb ? address : shortenAddress(address, maxLength)}
      {hideParentheses ? '' : ')'}
    </Text>
  )
}

export default React.memo(PlainAddress)
