import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import PrivacyPoolsIcon from '@common/assets/svg/PrivacyPoolsIcon'
import PublicAccountsIcon from '@common/assets/svg/PublicAccountsIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

/** The regular accounts are public, the Privacy Pools ones private. */
type AccountsTab = 'public' | 'private'

type Props = {
  activeTab: AccountsTab
  onTabChange: (tab: AccountsTab) => void
}

/** Switches the accounts list between the regular accounts and the Privacy Pools ones. */
const AccountsTabs: FC<Props> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)

  const tabs = useMemo(
    () => [
      {
        id: 'public' as const,
        label: t('Public'),
        Icon: PublicAccountsIcon,
        activeIconColor: theme.secondaryAccent400
      },
      {
        id: 'private' as const,
        label: t('Private'),
        Icon: PrivacyPoolsIcon,
        activeIconColor: theme.privacyPoolsText
      }
    ],
    [t, theme.privacyPoolsText, theme.secondaryAccent400]
  )

  return (
    <View style={styles.container}>
      {tabs.map(({ id, label, Icon, activeIconColor }) => {
        const isActive = activeTab === id

        return (
          <HoverablePressable
            key={id}
            testID={`accounts-tab-${id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onTabChange(id)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Icon width={24} height={24} color={isActive ? activeIconColor : undefined} />
            <Text
              fontSize={12}
              weight="medium"
              appearance={isActive ? 'primaryText' : 'secondaryText'}
            >
              {label}
            </Text>
          </HoverablePressable>
        )
      })}
    </View>
  )
}

export type { AccountsTab }
export default React.memo(AccountsTabs)
