import React, { FC, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import PrivacyPoolsIcon from '@common/assets/svg/PrivacyPoolsIcon'
import PublicAccountsIcon from '@common/assets/svg/PublicAccountsIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
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
  /** Why a tab cannot be opened, shown on hover. A tab with a reason is disabled. */
  disabledTabReasons?: Partial<Record<AccountsTab, string>>
  style?: ViewStyle
}

/**
 * Switches a list of accounts between the regular ones and the Privacy Pools ones: the accounts list
 * and the Send form's recipients.
 */
const AccountsTabs: FC<Props> = ({ activeTab, onTabChange, disabledTabReasons, style }) => {
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
    <View style={[styles.container, style]}>
      {tabs.map(({ id, label, Icon, activeIconColor }) => {
        const isActive = activeTab === id
        const disabledReason = disabledTabReasons?.[id]

        return (
          <HoverablePressable
            key={id}
            testID={`accounts-tab-${id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled: !!disabledReason }}
            // Not the `disabled` prop, which would block the tooltip's hover
            onPress={disabledReason ? undefined : () => onTabChange(id)}
            style={[
              styles.tab,
              isActive && styles.activeTab,
              !!disabledReason && styles.disabledTab
            ]}
            dataSet={
              disabledReason
                ? createGlobalTooltipDataSet({
                    id: `accounts-tab-${id}-disabled`,
                    content: disabledReason
                  })
                : undefined
            }
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
