import React from 'react'
import { StyleProp, TextStyle, View } from 'react-native'

import CopyText from '@common/components/CopyText'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

// @ts-expect-error web-only style, so long hex values wrap instead of overflowing
const wrapAnywhereStyle: TextStyle = { wordBreak: 'break-all' }

export const MonoText = React.memo(function MonoText({
  children,
  style
}: {
  children: string
  style?: StyleProp<TextStyle>
}) {
  return (
    <Text
      selectable
      fontSize={12}
      weight="mono_regular"
      style={[{ lineHeight: 18 }, wrapAnywhereStyle, style]}
    >
      {children}
    </Text>
  )
})

export const MonoBox = React.memo(function MonoBox({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        spacings.phSm,
        spacings.pvTy,
        { borderRadius: 8, backgroundColor: theme.secondaryBackground }
      ]}
    >
      {children}
    </View>
  )
})

export const SectionHeader = React.memo(function SectionHeader({
  title,
  copyText
}: {
  title: string
  copyText?: string
}) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.mtLg,
        spacings.mbTy
      ]}
    >
      <Text fontSize={14} weight="semiBold" style={[flexbox.flex1, spacings.mrSm]}>
        {title}
      </Text>
      {!!copyText && <CopyText text={copyText} iconSize={16} iconColor={theme.secondaryText} />}
    </View>
  )
})
