import React, { FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, View, ViewStyle } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import useShouldShowFullAddressOnWeb from '@common/components/AccountAddress/useShouldShowFullAddressOnWeb'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

import PlainAddress from './PlainAddress'

interface Props {
  maxLength: number
  address: string
  style?: ViewStyle
  hideParentheses?: boolean
  fontSize?: number
  children?: React.ReactNode
  withWrap?: boolean
  highlight?: {
    prefix: number
    suffix: number
    color: 'errorText'
  }
}

const PlainAddressWithCopy: FC<Props> = ({
  maxLength,
  address,
  style,
  hideParentheses,
  fontSize = 12,
  children,
  withWrap = false,
  highlight
}) => {
  const { isNarrowWebLayout } = useCompactLayout()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { theme } = useTheme()
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted'
  })

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width)
  }, [])

  const { shouldShowFullAddressOnWeb } = useShouldShowFullAddressOnWeb(
    maxLength,
    isNarrowWebLayout ? containerWidth : undefined
  )

  const handleCopy = async () => {
    try {
      await setStringAsync(address)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'))
    }
  }

  const iconSize = fontSize + 8

  const containerStyle = useMemo((): ViewStyle => {
    if (!isNarrowWebLayout) {
      // Keep popup / tab layout identical to v2.
      if (withWrap) {
        return { flexBasis: 110, flexGrow: 1, flexShrink: 1 }
      }

      return isMobile ? { flexShrink: 1, minWidth: 0 } : {}
    }

    if (withWrap) {
      return {
        flexBasis: 110,
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0
      }
    }

    return { flex: 1, flexShrink: 1, minWidth: 0 }
  }, [withWrap, isNarrowWebLayout])

  const plainAddressStyle = useMemo(() => {
    if (!isNarrowWebLayout) {
      // Keep popup / tab layout identical to v2, except for an address that doesn't fit its row.
      return {
        ...style,
        ...(maxLength === 42 ? { flexShrink: 1 } : {}),
        // A single-line address takes the full row width on web, which pushed the copy icon
        // past the row (e.g. under the clear button of an address input). Letting it shrink
        // only kicks in when the row is too narrow, where it ellipsizes to make room for the icon.
        ...(isWeb ? { flexShrink: 1, minWidth: 0 } : {}),
        ...(withWrap ? { minWidth: isMobile ? 70 : 170 } : {})
      }
    }

    return {
      ...style,
      ...(withWrap
        ? { minWidth: isMobile ? 70 : 170 }
        : shouldShowFullAddressOnWeb
          ? { flex: 1, flexShrink: 1, minWidth: 0 }
          : { flex: 1, flexShrink: 1, minWidth: 0 })
    }
  }, [style, withWrap, shouldShowFullAddressOnWeb, maxLength, isNarrowWebLayout])

  return (
    <View
      onLayout={isNarrowWebLayout ? handleLayout : undefined}
      style={[flexbox.directionRow, flexbox.alignCenter, containerStyle]}
    >
      <PlainAddress
        maxLength={maxLength}
        address={address}
        hideParentheses={hideParentheses}
        containerWidth={isNarrowWebLayout ? containerWidth : undefined}
        style={plainAddressStyle}
        fontSize={fontSize}
        withWrap={withWrap}
        highlight={highlight}
      />
      <AnimatedPressable
        onPress={handleCopy}
        // The icon must never shrink, so the address gives way instead of the icon overflowing
        style={[animStyle, { flexShrink: 0 }, isNarrowWebLayout && spacings.mlMi]}
        {...bindAnim}
      >
        {/* The icon is as small as the address next to it, so the default stroke reads as too thick */}
        <CopyIcon
          width={iconSize}
          height={iconSize}
          color={theme.secondaryText}
          strokeWidth="1.2"
        />
      </AnimatedPressable>
      {children}
    </View>
  )
}

export default PlainAddressWithCopy
