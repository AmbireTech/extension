import React, { FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, View, ViewStyle } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import useShouldShowFullAddressOnWeb from '@common/components/AccountAddress/useShouldShowFullAddressOnWeb'
import { isMobile, isWeb } from '@common/config/env'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { getUiType } from '@common/utils/uiType'

import PlainAddress from './PlainAddress'

const { isSidePanel } = getUiType()

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
    isSidePanel ? containerWidth : undefined
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
    if (!isSidePanel) {
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
  }, [withWrap])

  const plainAddressStyle = useMemo(() => {
    if (!isSidePanel) {
      // Keep popup / tab layout identical to v2.
      return {
        ...style,
        ...(maxLength === 42 ? { flexShrink: 1 } : {}),
        ...(isWeb ? { flexShrink: 0 } : {}),
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
  }, [style, withWrap, shouldShowFullAddressOnWeb, maxLength])

  return (
    <View
      onLayout={isSidePanel ? handleLayout : undefined}
      style={[flexbox.directionRow, flexbox.alignCenter, containerStyle]}
    >
      <PlainAddress
        maxLength={maxLength}
        address={address}
        hideParentheses={hideParentheses}
        containerWidth={isSidePanel ? containerWidth : undefined}
        style={plainAddressStyle}
        fontSize={fontSize}
        withWrap={withWrap}
        highlight={highlight}
      />
      <AnimatedPressable
        onPress={handleCopy}
        style={[animStyle, isSidePanel && [spacings.mlMi, { flexShrink: 0 }]]}
        {...bindAnim}
      >
        <CopyIcon width={iconSize} height={iconSize} color={theme.secondaryText} />
      </AnimatedPressable>
      {children}
    </View>
  )
}

export default PlainAddressWithCopy
