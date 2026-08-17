import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import HoverablePressable from '@common/components/HoverablePressable'
import NetworkBadge from '@common/components/NetworkBadge'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import SafeNonce from '@common/modules/sign-account-op/components/SafeNonce'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export type SafeAccountTab = 'overview' | 'safe-data'

interface Props {
  activeTab: SafeAccountTab
  networkChainId?: bigint
  onTabChange: (tab: SafeAccountTab) => void
}

const SafeAccountTabs: FC<Props> = ({ activeTab, networkChainId, onTabChange }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const handleOverviewTabPress = useCallback(() => {
    onTabChange('overview')
  }, [onTabChange])

  const handleSafeDataTabPress = useCallback(() => {
    onTabChange('safe-data')
  }, [onTabChange])

  const tabs = useMemo(
    () => [
      {
        id: 'overview' as const,
        label: t('Overview'),
        onPress: handleOverviewTabPress
      },
      {
        id: 'safe-data' as const,
        label: t('Hashes and JSON'),
        onPress: handleSafeDataTabPress
      }
    ],
    [handleOverviewTabPress, handleSafeDataTabPress, t]
  )

  return (
    <View
      style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween, spacings.mb]}
    >
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.mrSm,
          { flexShrink: 1, minWidth: 0 }
        ]}
      >
        {tabs.map(({ id, label, onPress }, index) => {
          const isActive = activeTab === id

          return (
            <HoverablePressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={onPress}
              style={[
                index < tabs.length - 1 ? spacings.mrSm : undefined,
                {
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? theme.secondaryAccent400 : 'transparent'
                }
              ]}
            >
              <Text
                fontSize={14}
                weight={isActive ? 'semiBold' : 'medium'}
                color={isActive ? theme.secondaryAccent400 : theme.secondaryText}
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                {label}
              </Text>
            </HoverablePressable>
          )
        })}
      </View>
      <View style={[flexbox.directionRow, flexbox.alignCenter, { flexShrink: 0 }]}>
        <SafeNonce />
        <NetworkBadge chainId={networkChainId} withOnPrefix style={spacings.mlSm} />
      </View>
    </View>
  )
}

export default React.memo(SafeAccountTabs)
