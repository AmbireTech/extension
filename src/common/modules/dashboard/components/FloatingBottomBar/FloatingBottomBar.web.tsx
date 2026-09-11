import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GlassView from '@common/components/GlassView'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import CurrentApp from './CurrentApp'
import SelectNetwork from './SelectNetwork'
import DashboardSearch from './DashboardSearch'
import { FloatingBottomBarProps } from './FloatingBottomBar'

const VISIBLE_BOTTOM_OFFSET = 0

const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({
  control,
  networkFilterTab,
  displayCurrentApp = false,
  isHidden,
  searchPlaceholder
}) => {
  const { bottom: safeBottom } = useSafeAreaInsets()

  const baseBottom = useMemo(() => SPACING + safeBottom, [safeBottom])

  const translateY = useMemo(
    () => (isHidden ? 60 + safeBottom + SPACING : VISIBLE_BOTTOM_OFFSET),
    [isHidden, safeBottom]
  )

  return (
    <View
      style={[
        {
          position: 'absolute',
          bottom: baseBottom,
          zIndex: 3,
          left: 0,
          width: '100%',
          pointerEvents: 'none',
          transform: `translateY(${translateY}px)`,
          transitionProperty: 'transform',
          transitionDuration: '450ms',
          transitionTimingFunction: 'cubic-bezier(0.45, 0, 0.55, 1)',
          ...flexbox.center
        } as any
      ]}
    >
      <GlassView borderRadius={28} cssStyle={{ pointerEvents: 'all' }} isSimpleBlur={false}>
        <View style={[spacings.phTy, spacings.pvTy, flexbox.directionRow, flexbox.alignCenter]}>
          {!!control && <DashboardSearch control={control} placeholder={searchPlaceholder} />}
          {!!networkFilterTab && (
            <View style={control ? { marginLeft: SPACING } : undefined}>
              <SelectNetwork currentTab={networkFilterTab} />
            </View>
          )}
          {displayCurrentApp && <CurrentApp />}
        </View>
      </GlassView>
    </View>
  )
}

export default React.memo(FloatingBottomBar)
