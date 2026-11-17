import React from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GlassView from '@common/components/GlassView'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import CurrentApp from './CurrentApp'
import SelectNetwork from './SelectNetwork'
import DashboardSearch from './DashboardSearch'
import { FloatingBottomBarProps } from './FloatingBottomBar'

const FloatingBottomBar: React.FC<FloatingBottomBarProps> = ({
  control,
  networkFilterTab,
  displayCurrentApp = false,
  searchPlaceholder
}) => {
  const { bottom: safeBottom } = useSafeAreaInsets()

  // Hiding it is the carousel's, which moves it together with the overview
  return (
    <View
      style={[
        {
          position: 'absolute',
          bottom: SPACING + safeBottom,
          zIndex: 3,
          left: 0,
          width: '100%',
          pointerEvents: 'none',
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
