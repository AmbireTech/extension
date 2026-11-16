import React, { FC, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import PrivacyPoolsIcon from '@common/assets/svg/PrivacyPoolsIcon'
import PublicAccountsIcon from '@common/assets/svg/PublicAccountsIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import SoonBadge from '@common/components/SoonBadge'
import Text from '@common/components/Text'
import { isPrivacyPoolsComingSoon } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

/** The regular accounts are public, the Privacy Pools ones private. */
type AccountsTab = 'public' | 'private'

type Props = {
  activeTab: AccountsTab
  onTabChange: (tab: AccountsTab) => void
  /**
   * Why a tab cannot be opened, shown on hover. A tab with a reason is disabled. Where Privacy Pools
   * are not released yet, the Private tab is always disabled with a "Coming soon" reason.
   */
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

  const tabDisabledReasons = useMemo(
    () =>
      isPrivacyPoolsComingSoon
        ? { ...disabledTabReasons, private: t('Send and receive privately. Coming soon.') }
        : disabledTabReasons,
    [disabledTabReasons, t]
  )

  return (
    <View style={[styles.container, style]}>
      {tabs.map(({ id, label, Icon, activeIconColor }) => {
        const isActive = activeTab === id
        const disabledReason = tabDisabledReasons?.[id]

        return (
          <HoverablePressable
            key={id}
            testID={`accounts-tab-${id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled: !!disabledReason }}
            // Not the `disabled` prop, which would block the tooltip's hover
            onPress={disabledReason ? undefined : () => onTabChange(id)}
            style={[styles.tab, isActive && styles.activeTab]}
            dataSet={
              disabledReason
                ? createGlobalTooltipDataSet({
                    id: `accounts-tab-${id}-disabled`,
                    content: disabledReason
                  })
                : undefined
            }
          >
            {/* Only the label is dimmed when disabled, the "Soon" badge stays readable */}
            <View style={[styles.tabLabel, !!disabledReason && styles.disabledTabLabel]}>
              <Icon width={24} height={24} color={isActive ? activeIconColor : undefined} />
              <Text
                fontSize={12}
                weight="medium"
                appearance={isActive ? 'primaryText' : 'secondaryText'}
              >
                {label}
              </Text>
            </View>
            {id === 'private' && isPrivacyPoolsComingSoon && <SoonBadge />}
          </HoverablePressable>
        )
      })}
    </View>
  )
}

export type { AccountsTab }
export default React.memo(AccountsTabs)
