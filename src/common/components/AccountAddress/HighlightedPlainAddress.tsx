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
    /**
     * When set, only the chars that differ from this address are highlighted, instead of
     * everything between the matched prefix and suffix. Used for near-identical addresses.
     */
    differingFrom?: string
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
  const { prefix, suffix, color, differingFrom } = highlight

  const segments = useMemo(() => {
    if (differingFrom) {
      const normalizedAddress = address.toLowerCase()
      const normalizedDifferingFrom = differingFrom.toLowerCase()
      const differingSegments: { start: number; text: string; isHighlighted: boolean }[] = []

      for (let i = 0; i < address.length; i += 1) {
        const isHighlighted = normalizedAddress[i] !== normalizedDifferingFrom[i]
        const lastSegment = differingSegments[differingSegments.length - 1]
        if (lastSegment?.isHighlighted === isHighlighted) {
          lastSegment.text += address[i]
        } else {
          differingSegments.push({ start: i, text: address[i]!, isHighlighted })
        }
      }

      return differingSegments
    }

    // Match counts are based on address body (without 0x), rendered string includes 0x.
    const prefixOffset = address.startsWith('0x') ? 2 : 0
    const normalizedPrefix = prefix + prefixOffset
    const safePrefixNormalized = Math.max(0, Math.min(normalizedPrefix, address.length))
    const safeSuffix = Math.max(0, Math.min(suffix, address.length - safePrefixNormalized))
    const middleEnd = address.length - safeSuffix

    return [
      { start: 0, text: address.slice(0, safePrefixNormalized), isHighlighted: false },
      {
        start: safePrefixNormalized,
        text: address.slice(safePrefixNormalized, middleEnd),
        isHighlighted: true
      },
      { start: middleEnd, text: address.slice(middleEnd), isHighlighted: false }
    ]
  }, [address, prefix, suffix, differingFrom])

  const textLineHeight = Math.ceil(fontSize * 1.5)
  // On mobile a single line cuts out the middle of the address, which is where the few
  // mistyped chars of a near-identical address usually are, so it wraps to show all of them
  const shouldWrapNearIdenticalAddress = isMobile && !!differingFrom
  const shouldWrap = withWrap || shouldWrapNearIdenticalAddress

  return (
    <Text
      fontSize={fontSize}
      appearance="secondaryText"
      weight="mono_regular"
      style={[
        spacings.mrMi,
        { lineHeight: textLineHeight },
        style,
        withWrap && {
          // @ts-ignore web-only style for wrapping long hex addresses
          wordBreak: 'break-all'
        },
        // Lets the text wrap within its row instead of overflowing it
        shouldWrapNearIdenticalAddress && { flexShrink: 1 }
      ]}
      numberOfLines={shouldWrap ? undefined : 1}
      ellipsizeMode={!shouldWrap && isMobile ? 'middle' : undefined}
    >
      {hideParentheses ? '' : '('}
      {segments.map(({ start, text, isHighlighted }) =>
        isHighlighted ? (
          <Text
            key={start}
            fontSize={fontSize}
            appearance={color}
            weight="mono_regular"
            style={{ fontWeight: '600', lineHeight: textLineHeight }} // we only have _regular font for mono, this makes it a little bolder
          >
            {text}
          </Text>
        ) : (
          <Text
            key={start}
            fontSize={fontSize}
            appearance="secondaryText"
            weight="mono_regular"
            style={{ lineHeight: textLineHeight }}
          >
            {text}
          </Text>
        )
      )}
      {hideParentheses ? '' : ')'}
    </Text>
  )
}

export default React.memo(HighlightedPlainAddress)
