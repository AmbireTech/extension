import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import HoverablePressable from '@common/components/HoverablePressable'
import NetworkBadge from '@common/components/NetworkBadge'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import SafeNonce from '@common/modules/sign-account-op/components/SafeNonce'
import type { ActiveTab as SafeEip712ActiveTab } from '@common/modules/sign-account-op/components/SafeEip712Data'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

// The Hashes/Parsed/Raw tabs used to be sub-tabs nested inside a single "Hashes and JSON" tab.
// They are flattened into top-level tabs here, alongside Overview, to remove that extra level.
export type SafeAccountTab = 'overview' | SafeEip712ActiveTab

const TAB_IDS: SafeAccountTab[] = ['overview', 'hashes', 'parsed', 'raw']

interface Props {
  activeTab: SafeAccountTab
  networkChainId?: bigint
  onTabChange: (tab: SafeAccountTab) => void
}

const SafeAccountTabs: FC<Props> = ({ activeTab, networkChainId, onTabChange }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const tabLabels: { [key in SafeAccountTab]: string } = useMemo(
    () => ({
      overview: t('Overview'),
      hashes: t('Hashes'),
      parsed: t('Parsed'),
      raw: t('Raw')
    }),
    [t]
  )

  const tabs = useMemo(
    () =>
      TAB_IDS.map((id) => ({
        id,
        label: tabLabels[id],
        onPress: () => onTabChange(id)
      })),
    [tabLabels, onTabChange]
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
