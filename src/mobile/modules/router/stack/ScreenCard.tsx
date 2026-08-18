import React, { ReactNode } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated'

import { isiOS } from '@common/config/env'
import { ScreenFocusProvider } from '@common/contexts/screenFocusContext'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

import { getCardStyleValues } from './presets'

type Props = {
  children: ReactNode
  /**
   * How far this card is offset from its settled position, in pixels. Owned and
   * animated by the stack, which is the only place that knows about transitions.
   */
  offset: SharedValue<number>
  /** The offset of the card stacked on top of this one, which parallaxes it away. */
  nextOffset: SharedValue<number> | null
  /**
   * The screen the user is on: the top card, unless it is on its way out. Cards
   * below it stay mounted but are neither focused nor able to take touches - they
   * are covered by the card above them.
   */
  isFocused: boolean
  /** This card was popped and is animating out. */
  isClosing: boolean
}

const ScreenCard = ({ children, offset, nextOffset, isFocused, isClosing }: Props) => {
  const { theme } = useTheme()
  const { width } = useWindowDimensions()

  const values = useDerivedValue(() =>
    getCardStyleValues(offset.value, nextOffset ? nextOffset.value : width, width, isClosing)
  )

  const cardStyle = useAnimatedStyle(() => ({
    opacity: values.value.opacity,
    transform: [{ translateX: values.value.translateX }, { scale: values.value.scale }]
  }))
  const overlayStyle = useAnimatedStyle(() => ({ opacity: values.value.overlayOpacity }))
  const shadowStyle = useAnimatedStyle(() => ({ shadowOpacity: values.value.shadowOpacity }))

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isFocused ? 'auto' : 'none'}>
      {!!isiOS && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
          pointerEvents="none"
        />
      )}
      <Animated.View
        style={[flexbox.flex1, { backgroundColor: theme.primaryBackground }, cardStyle]}
      >
        {!!isiOS && (
          <Animated.View
            style={[styles.shadow, { backgroundColor: theme.primaryBackground }, shadowStyle]}
            pointerEvents="none"
          />
        )}
        <ScreenFocusProvider isFocused={isFocused}>{children}</ScreenFocusProvider>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#000'
  },
  // A sliver along the leading edge of the card, so the card casts a shadow onto
  // the screen it is covering - the same geometry UIKit uses.
  shadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 3,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 1 },
    shadowRadius: 5
  }
})

export default ScreenCard
