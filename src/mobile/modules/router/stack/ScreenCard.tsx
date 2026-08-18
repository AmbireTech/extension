import React, { ReactNode, useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { Freeze } from 'react-freeze'
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue
} from 'react-native-reanimated'

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
  /**
   * A finger is down in the back gesture's edge strip. Nothing has moved yet, so
   * this is the earliest warning a hidden card gets that it is about to be
   * revealed and has to be rendering again by then.
   */
  isBackGesturePending: boolean
}

const ScreenCard = ({
  children,
  offset,
  nextOffset,
  isFocused,
  isClosing,
  isBackGesturePending
}: Props) => {
  const { theme } = useTheme()
  const { width } = useWindowDimensions()

  const [isCoveredByCardAbove, setIsCoveredByCardAbove] = useState(false)

  // Watched on the UI thread, so the moment the card above leaves its resting
  // place - dragged or animating - this card is rendering again before any of it
  // can be seen.
  useAnimatedReaction(
    () => !!nextOffset && nextOffset.value === 0,
    (isCovered, wasCovered) => {
      if (isCovered !== wasCovered) runOnJS(setIsCoveredByCardAbove)(isCovered)
    }
  )

  // A frozen subtree renders nothing at all, so only a card that is completely
  // hidden behind another one may be frozen - anything still visible would go
  // blank. In exchange, a screen sitting under another one stops re-rendering on
  // every controller update it can no longer show.
  const isFrozen = isCoveredByCardAbove && !isFocused && !isBackGesturePending

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
        <ScreenFocusProvider isFocused={isFocused}>
          <Freeze freeze={isFrozen}>{children}</Freeze>
        </ScreenFocusProvider>
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
