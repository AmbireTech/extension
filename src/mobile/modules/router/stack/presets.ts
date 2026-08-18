import { Platform } from 'react-native'
import {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  withSpring,
  withTiming,
  WithSpringConfig,
  WithTimingConfig
} from 'react-native-reanimated'

import { isiOS } from '@common/config/env'

/**
 * The transition of a card is driven by a single value: how far it is offset
 * from its settled position, in pixels (0 = on screen, `distance` = off screen).
 * Pixels rather than a 0..1 progress, because that is the unit the platform
 * spring thresholds and the gesture velocity are expressed in.
 */
export type CardStyleValues = {
  translateX: number
  scale: number
  opacity: number
  /** Dims whatever is rendered below the card (iOS). */
  overlayOpacity: number
  /** Shadow cast by the leading edge of the card (iOS). */
  shadowOpacity: number
}

type TransitionSpec =
  | { type: 'spring'; config: WithSpringConfig }
  | { type: 'timing'; config: WithTimingConfig }

const ANDROID_14 = 34

/**
 * Which platform convention this build animates with. Android's own default
 * changed with Android 14, so devices below it keep the older look instead of
 * getting a transition their OS never used.
 */
const PRESET: 'ios' | 'androidFadeFromRight' | 'androidScaleFromCenter' = isiOS
  ? 'ios'
  : Number(Platform.Version) >= ANDROID_14
    ? 'androidFadeFromRight'
    : 'androidScaleFromCenter'

// UINavigationController's push/pop spring. Heavily overdamped, so it settles
// without a bounce. `energyThreshold` stands in for the platform's 10px rest
// displacement/speed thresholds, which Reanimated 4 replaced with a single
// relative one - it only cuts the imperceptible tail of the motion short.
const IOS_SPEC: TransitionSpec = {
  type: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    energyThreshold: 6e-4
  }
}

const ANDROID_ACCELERATE_DECELERATE = Easing.bezier(0.20833, 0.82, 0.25, 1)

const ANDROID_FADE_IN_SPEC: TransitionSpec = {
  type: 'timing',
  config: { duration: 350, easing: Easing.out(Easing.poly(5)) }
}

const ANDROID_FADE_OUT_SPEC: TransitionSpec = {
  type: 'timing',
  config: { duration: 150, easing: Easing.in(Easing.linear) }
}

const ANDROID_SCALE_SPEC: TransitionSpec = {
  type: 'timing',
  config: { duration: 400, easing: ANDROID_ACCELERATE_DECELERATE }
}

const OPEN_SPEC =
  PRESET === 'ios'
    ? IOS_SPEC
    : PRESET === 'androidFadeFromRight'
      ? ANDROID_FADE_IN_SPEC
      : ANDROID_SCALE_SPEC

const CLOSE_SPEC =
  PRESET === 'ios'
    ? IOS_SPEC
    : PRESET === 'androidFadeFromRight'
      ? ANDROID_FADE_OUT_SPEC
      : ANDROID_SCALE_SPEC

/** How much of the card slides in on Android, where it is a short fade, not a full slide. */
const ANDROID_TRANSLATE = 96

const NEUTRAL: CardStyleValues = {
  translateX: 0,
  scale: 1,
  opacity: 1,
  overlayOpacity: 0,
  shadowOpacity: 0
}

/**
 * The animated style of one card, from its own offset and the offset of the
 * card stacked on top of it (`distance` when there is none, i.e. fully closed).
 */
const getCardStyleValues = (
  offset: number,
  nextOffset: number,
  distance: number,
  isClosing: boolean
): CardStyleValues => {
  'worklet'

  const progress = interpolate(offset, [0, distance], [1, 0], Extrapolation.CLAMP)
  const nextProgress = interpolate(nextOffset, [0, distance], [1, 0], Extrapolation.CLAMP)

  if (PRESET === 'ios') {
    return {
      ...NEUTRAL,
      translateX:
        interpolate(progress, [0, 1], [distance, 0], Extrapolation.CLAMP) +
        interpolate(nextProgress, [0, 1], [0, distance * -0.3], Extrapolation.CLAMP),
      overlayOpacity: interpolate(progress, [0, 1], [0, 0.07], Extrapolation.CLAMP),
      shadowOpacity: interpolate(progress, [0, 1], [0, 0.3], Extrapolation.CLAMP)
    }
  }

  if (PRESET === 'androidFadeFromRight') {
    return {
      ...NEUTRAL,
      translateX:
        interpolate(progress, [0, 1], [ANDROID_TRANSLATE, 0], Extrapolation.CLAMP) +
        interpolate(nextProgress, [0, 1], [0, -ANDROID_TRANSLATE], Extrapolation.CLAMP),
      opacity: progress
    }
  }

  const combinedProgress = progress + nextProgress

  return {
    ...NEUTRAL,
    opacity: interpolate(
      combinedProgress,
      [0, 0.75, 0.875, 1, 1.0825, 1.2075, 2],
      [0, 0, 1, 1, 1, 1, 0]
    ),
    scale: isClosing
      ? interpolate(progress, [0, 1], [0.925, 1], Extrapolation.CLAMP)
      : interpolate(combinedProgress, [0, 1, 2], [0.85, 1, 1.075])
  }
}

/**
 * Starts the platform's own motion towards `toValue`. Callable from the JS
 * thread (a push/pop) and from a gesture worklet (a swipe release), which is
 * why the release velocity is an argument rather than being read from a gesture.
 */
const animateOffset = (
  toValue: number,
  spec: TransitionSpec,
  velocity?: number,
  onDone?: (finished?: boolean) => void
) => {
  'worklet'

  // The key is left out entirely when there is no release velocity to hand over:
  // `velocity: undefined` reaches Reanimated's initial energy calculation as NaN,
  // and the spring's "has it come to rest" test then never passes - the animation
  // runs correctly but reports completion to nobody.
  if (spec.type === 'spring')
    return withSpring(
      toValue,
      velocity === undefined ? spec.config : { ...spec.config, velocity },
      onDone
    )

  return withTiming(toValue, spec.config, onDone)
}

/**
 * Writes a value - or an animation towards one - to a card offset. Lives here so
 * the stack that owns the offsets can drive them from an effect or from a gesture
 * worklet alike.
 */
const driveOffset = (offset: SharedValue<number>, value: number) => {
  'worklet'

  offset.value = value
}

export { animateOffset, CLOSE_SPEC, driveOffset, getCardStyleValues, OPEN_SPEC, PRESET }
export type { TransitionSpec }
