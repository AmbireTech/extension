import React from 'react'
import { View } from 'react-native'

import { useModalize } from 'react-native-modalize'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import { isAmbireNext, isDev, isMobile } from '@common/config/env'
import { AnimatedPressable, DURATIONS, useMultiHover } from '@common/hooks/useHover'
import useController from '@common/hooks/useController'

import AnimatedGradientBorder from './AnimatedGradientBorder'
import { COLLAPSED_WIDTH, PEEK_WIDTH } from './constants'
import MobileAppInfoBottomSheet from './MobileAppInfoBottomSheet'
import PillContent from './PillContent'
import styles from './styles'

const selectMobileInviteKey = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.mobileInviteKey

const MobileAppPromoBanner = () => {
  const { state: mobileInviteKey } = useController(
    'SelectedAccountController',
    selectMobileInviteKey
  )
  const { ref: sheetRef, open: openInfoSheet, close: closeInfoSheet } = useModalize()

  // `container` itself is the hover box, and its `width` is what's animated (not an inner
  // layer) - collapsed, it's exactly PEEK_WIDTH, so only the actually visible sliver is
  // hoverable. This is safe from the earlier feedback-loop bug (where animating a box's
  // own edge under a stationary cursor fired a spurious hover-out): `right: 0` is fixed,
  // so growing only ever adds area to the left - a cursor already inside the collapsed
  // (smallest) bounds stays inside for the whole transition, it's never chased/dropped.
  const [bindAnim, animStyle] = useMultiHover({
    values: [
      { property: 'width', from: PEEK_WIDTH, to: COLLAPSED_WIDTH, duration: DURATIONS.REGULAR }
    ]
  })

  // This component only ever gets bundled from src/web/, so `isMobile` (the native
  // iOS/Android app) can never actually be true here - kept as an explicit guard anyway,
  // since the mobile app must never show a banner promoting itself.
  // The relayer only returns a mobile invite key for accounts it has generated one for -
  // hide the whole promo when there isn't one to activate the mobile app with.
  // Rolling out gradually - only on dev builds and the Ambire Next preview build, not
  // yet on the real production build.
  if (isMobile || !mobileInviteKey || !(isDev || isAmbireNext)) return null

  return (
    <>
      <AnimatedPressable style={[styles.container, animStyle]} {...bindAnim}>
        <View style={styles.headerRow}>
          <View style={styles.borderClip} pointerEvents="none">
            <View style={styles.borderLayer}>
              <AnimatedGradientBorder />
            </View>
          </View>
          <PillContent onPress={openInfoSheet} />
        </View>
      </AnimatedPressable>
      <MobileAppInfoBottomSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeInfoSheet}
        inviteCode={mobileInviteKey}
      />
    </>
  )
}

export default React.memo(MobileAppPromoBanner)
