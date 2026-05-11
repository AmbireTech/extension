import React, { FC, useMemo } from 'react'

import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'

type Props = {
  address: string
  highlight: {
    prefix: number
    suffix: number
    color: 'errorText'
  }
  fontSize?: number
  hideParentheses?: boolean
  style?: any
  withWrap?: boolean
}

const HighlightedPlainAddress: FC<Props> = ({
  address,
  highlight,
  fontSize = 12,
  hideParentheses,
  style,
  withWrap = false
}) => {
  const { prefix, suffix, color } = highlight

  const { prefixText, middleText, suffixText } = useMemo(() => {
    // Match counts are based on address body (without 0x), rendered string includes 0x.
    const prefixOffset = address.startsWith('0x') ? 2 : 0
    const normalizedPrefix = prefix + prefixOffset
    const safePrefixNormalized = Math.max(0, Math.min(normalizedPrefix, address.length))
    const safeSuffix = Math.max(0, Math.min(suffix, address.length - safePrefixNormalized))

    return {
      prefixText: address.slice(0, safePrefixNormalized),
      middleText: address.slice(safePrefixNormalized, address.length - safeSuffix),
      suffixText: address.slice(address.length - safeSuffix)
    }
  }, [address, prefix, suffix])

  return (
    <Text
      fontSize={fontSize}
      appearance="secondaryText"
      weight="mono_regular"
      style={[spacings.mrMi, style]}
      numberOfLines={withWrap ? undefined : 1}
      ellipsizeMode={!withWrap && isMobile ? 'middle' : undefined}
    >
      {hideParentheses ? '' : '('}
      <Text fontSize={fontSize} appearance="secondaryText" weight="mono_regular">
        {prefixText}
      </Text>
      <Text
        fontSize={fontSize}
        appearance={color}
        weight="mono_regular"
        style={{ fontWeight: '600' }} // we only have _regular font for mono, this makes it a little bolder
      >
        {middleText}
      </Text>
      <Text fontSize={fontSize} appearance="secondaryText" weight="mono_regular">
        {suffixText}
      </Text>
      {hideParentheses ? '' : ')'}
    </Text>
  )
}

export default React.memo(HighlightedPlainAddress)
