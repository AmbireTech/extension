import React from 'react'
import { Animated, Pressable, View } from 'react-native'

import { useModalize } from 'react-native-modalize'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import { DURATIONS, useMultiHover } from '@common/hooks/useHover'
import useController from '@common/hooks/useController'

import AnimatedGradientBorder from './AnimatedGradientBorder'
import { COLLAPSED_WIDTH, PEEK_WIDTH } from './constants'
import MobileAppInfoBottomSheet from './MobileAppInfoBottomSheet'
import PillContent from './PillContent'
import styles from './styles'

// Collapsed, only PEEK_WIDTH of the sliding inner layer is visible inside `container`'s
// clip - the rest hangs off its right side. `container` itself (the hover-detection box)
// never moves or resizes, so the slide can't chase/lose the cursor mid-transition.
const HIDDEN_OFFSET = COLLAPSED_WIDTH - PEEK_WIDTH

const selectMobileInviteKey = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.mobileInviteKey

const MobileAppPromoBanner = () => {
  const { state: mobileInviteKey } = useController(
    'SelectedAccountController',
    selectMobileInviteKey
  )
  const { ref: sheetRef, open: openInfoSheet, close: closeInfoSheet } = useModalize()

  const [bindAnim, animStyle] = useMultiHover({
    values: [{ property: 'marginLeft', from: HIDDEN_OFFSET, to: 0, duration: DURATIONS.REGULAR }]
  })

  // The relayer only returns a mobile invite key for accounts it has generated one for -
  // hide the whole promo when there isn't one to activate the mobile app with.
  if (!mobileInviteKey) return null

  return (
    <>
      <Pressable style={styles.container} {...bindAnim}>
        <View style={styles.slideClip}>
          <Animated.View style={[styles.headerRow, animStyle]}>
            <View style={styles.borderClip} pointerEvents="none">
              <View style={styles.borderLayer}>
                <AnimatedGradientBorder />
              </View>
            </View>
            <PillContent onPress={openInfoSheet} />
          </Animated.View>
        </View>
      </Pressable>
      <MobileAppInfoBottomSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeInfoSheet}
        inviteCode={mobileInviteKey}
      />
    </>
  )
}

export default React.memo(MobileAppPromoBanner)
