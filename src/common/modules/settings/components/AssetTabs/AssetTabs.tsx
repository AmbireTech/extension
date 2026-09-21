import React, { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export type AssetTab = 'tokens' | 'nfts'

const TABS: { type: AssetTab; label: string; testID: string }[] = [
  { type: 'tokens', label: 'Tokens', testID: 'custom-assets-tab-tokens' },
  { type: 'nfts', label: 'NFTs', testID: 'custom-assets-tab-nfts' }
]

type TabProps = {
  type: AssetTab
  label: string
  testID: string
  isActive: boolean
  setActiveTab: (tab: AssetTab) => void
  isFirst: boolean
}

const Tab: FC<TabProps> = ({ type, label, testID, isActive, setActiveTab, isFirst }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const onPress = useCallback(() => setActiveTab(type), [setActiveTab, type])

  return (
    <Pressable testID={testID} onPress={onPress} style={!isFirst && spacings.mlLg}>
      {({ hovered }: any) => (
        <View
          style={[
            spacings.pbTy,
            {
              borderBottomColor: isActive ? theme.primaryText : 'transparent',
              borderBottomWidth: 2
            }
          ]}
        >
          <Text
            weight="medium"
            fontSize={16}
            color={isActive || hovered ? theme.primaryText : theme.tertiaryText}
          >
            {t(label)}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

type Props = {
  activeTab: AssetTab
  setActiveTab: (tab: AssetTab) => void
}

const AssetTabs: FC<Props> = ({ activeTab, setActiveTab }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.mbMd,
        { borderBottomWidth: 1, borderBottomColor: theme.secondaryBorder }
      ]}
    >
      {TABS.map(({ type, label, testID }, index) => (
        <Tab
          key={type}
          type={type}
          label={label}
          testID={testID}
          isActive={activeTab === type}
          setActiveTab={setActiveTab}
          isFirst={index === 0}
        />
      ))}
    </View>
  )
}

export default React.memo(AssetTabs)
