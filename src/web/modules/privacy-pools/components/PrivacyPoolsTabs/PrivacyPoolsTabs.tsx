import React, { FC, useCallback } from 'react'
import { View } from 'react-native'

import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export type PrivacyPoolsTab = 'pooled' | 'activity'

const ACTIVE_TAB_BORDER_WIDTH = 2

const TABS: { tab: PrivacyPoolsTab; label: string }[] = [
  { tab: 'pooled', label: 'Pooled' },
  { tab: 'activity', label: 'Activity' }
]

interface Props {
  openTab: PrivacyPoolsTab
  setOpenTab: (tab: PrivacyPoolsTab) => void
}

// Mirrors the dashboard's tab bar
const PrivacyPoolsTabs: FC<Props> = ({ openTab, setOpenTab }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const handlePress = useCallback((tab: PrivacyPoolsTab) => () => setOpenTab(tab), [setOpenTab])

  return (
    <View style={[flexbox.directionRow, flexbox.alignEnd, spacings.mbSm]}>
      {TABS.map(({ tab, label }, index) => {
        const isOpen = openTab === tab

        return (
          <HoverablePressable
            key={tab}
            testID={`privacy-pools-tab-${tab}`}
            onPress={handlePress(tab)}
            style={[
              index > 0 && spacings.mlSm,
              {
                borderBottomWidth: ACTIVE_TAB_BORDER_WIDTH,
                borderBottomColor: isOpen ? theme.primaryText : 'transparent'
              }
            ]}
          >
            <Text
              fontSize={16}
              weight="medium"
              color={isOpen ? theme.primaryText : theme.secondaryText}
            >
              {t(label)}
            </Text>
          </HoverablePressable>
        )
      })}
    </View>
  )
}

export default React.memo(PrivacyPoolsTabs)
