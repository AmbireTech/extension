import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AccountsIcon from '@common/assets/svg/AccountsIcon'
import AddressBookIcon from '@common/assets/svg/AddressBookIcon'
import BugIcon from '@common/assets/svg/BugIcon'
import BulbIcon from '@common/assets/svg/BulbIcon'
import CustomTokensIcon from '@common/assets/svg/CustomTokensIcon'
import HelpIcon from '@common/assets/svg/HelpIcon'
import KeyStoreSettingsIcon from '@common/assets/svg/KeyStoreSettingsIcon'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import PasswordRecoverySettingsIcon from '@common/assets/svg/PasswordRecoverySettingsIcon'
import PrivacyIcon from '@common/assets/svg/PrivacyIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import SidebarSecurityIcon from '@common/assets/svg/SidebarSecurityIcon'
import SignedMessageIcon from '@common/assets/svg/SignedMessageIcon'
import TransactionHistoryIcon from '@common/assets/svg/TransactionHistoryIcon'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import SettingsLink from '@web/modules/settings/components/SettingsLink'

import getStyles from './styles'

export const SETTINGS_LINKS = [
  {
    key: 'general',
    Icon: SettingsIcon,
    label: 'General',
    path: ROUTES.generalSettings
  },
  {
    key: 'accounts',
    Icon: React.memo(AccountsIcon),
    label: 'Accounts',
    path: ROUTES.accountsSettings
  },
  {
    key: 'address-book',
    Icon: React.memo(AddressBookIcon),
    label: 'Address Book',
    path: ROUTES.addressBook
  },
  {
    key: 'networks',
    Icon: React.memo(NetworksIcon),
    label: 'Networks',
    path: ROUTES.networksSettings
  },
  {
    key: 'transactions',
    Icon: React.memo(TransactionHistoryIcon),
    label: 'Transaction history',
    path: ROUTES.transactions
  },
  {
    key: 'messages',
    Icon: React.memo(SignedMessageIcon),
    label: 'Signed messages',
    path: ROUTES.signedMessages
  },
  {
    key: 'recovery-phrases',
    Icon: SidebarSecurityIcon,
    label: 'Recovery phrases',
    path: ROUTES.recoveryPhrasesSettings
  },
  {
    key: 'device-password-change',
    Icon: React.memo(KeyStoreSettingsIcon),
    label: 'Extension password',
    path: ROUTES.devicePasswordChange
  },
  {
    key: 'device-password-recovery',
    Icon: React.memo(PasswordRecoverySettingsIcon),
    label: 'Password recovery',
    path: ROUTES.devicePasswordRecovery
  },
  {
    key: 'opt-outs',
    Icon: React.memo(PrivacyIcon),
    label: 'Privacy Opt-outs',
    path: ROUTES.optOuts
  },
  // Disabled for now - will be added in future releases
  // {
  //   key: 'email-vault',
  //   Icon: React.memo(({ color }: SvgProps) => (
  //     <EmailVaultIcon strokeWidth={3.5} width={24} height={24} color={color} />
  //   )),
  //   label: 'Ambire Cloud (coming soon)',
  //   path: '/settings/email-vault'
  // },
  {
    key: 'manage-tokens',
    Icon: React.memo(CustomTokensIcon),
    label: 'Custom tokens',
    path: ROUTES.manageTokens
  }
]

const OTHER_LINKS = [
  {
    key: 'about',
    Icon: BulbIcon,
    label: 'About',
    path: ROUTES.settingsAbout
  },
  {
    key: 'help-center',
    Icon: React.memo(HelpIcon),
    label: 'Help Center',
    path: 'https://help.ambire.com/hc/en-us',
    isExternal: true
  },
  {
    key: 'report-issue',
    Icon: React.memo(BugIcon),
    label: 'Report an issue',
    path: 'https://help.ambire.com/hc/en-us/requests/new',
    isExternal: true
  }
]

const Sidebar = ({ activeLink }: { activeLink?: string }) => {
  const keystoreState = useKeystoreControllerState()
  const { theme, themeType, styles } = useTheme(getStyles)
  const { state } = useRoute()
  const { navigate } = useNavigation()
  const [validBackRoute, setValidBackRoute] = useState<'dashboard' | 'transfer' | null>(null)
  const isTransferPreviousPage = state?.prevRoute?.pathname?.includes(ROUTES.transfer)
  const isDashboardPreviousPage = state?.prevRoute?.pathname.includes(WEB_ROUTES.dashboard)
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.tertiaryBackground
    }
  })
  const { t } = useTranslation()

  useEffect(() => {
    // No need to reset it as navigating out of settings will unmount the component
    if (validBackRoute) return

    if (isTransferPreviousPage) {
      setValidBackRoute('transfer')
    } else if (isDashboardPreviousPage) {
      setValidBackRoute('dashboard')
    }
  }, [isDashboardPreviousPage, isTransferPreviousPage, validBackRoute])

  return (
    <View style={{ ...spacings.pbLg, position: 'relative', height: '100%' }}>
      {validBackRoute && (
        <AnimatedPressable
          style={[styles.backToDashboardButton, animStyle]}
          onPress={() => {
            if (validBackRoute === 'transfer') {
              navigate(ROUTES.transfer)
              return
            }

            navigate(WEB_ROUTES.dashboard)
          }}
          {...bindAnim}
        >
          <LeftArrowIcon color={theme.secondaryText} />
          <Text fontSize={16} weight="medium" appearance="secondaryText" style={spacings.mlLg}>
            {validBackRoute === 'transfer' ? t('Send') : t('Dashboard')}
          </Text>
        </AnimatedPressable>
      )}
      <View style={styles.settingsTitleWrapper}>
        <Text style={[spacings.ml]} fontSize={20} weight="medium">
          {t('Settings')}
        </Text>
      </View>
      <ScrollableWrapper>
        {SETTINGS_LINKS.map((_link, i) => {
          // If the KeyStore device password is not configured yet, redirect to DevicePassword->Set route under the hood,
          // instead of loading DevicePassword->Change route.
          const link =
            !keystoreState.hasPasswordSecret && _link.key === 'device-password-change'
              ? { ..._link, key: 'device-password-set', path: ROUTES.devicePasswordSet }
              : _link
          const isActive = activeLink === link.key

          return (
            <SettingsLink
              {...link}
              key={link.key}
              isActive={isActive}
              style={i === SETTINGS_LINKS.length - 1 ? spacings.mb0 : {}}
            />
          )
        })}
        <View
          style={{
            width: '100%',
            borderBottomWidth: 1,
            borderColor:
              themeType === THEME_TYPES.DARK ? theme.primaryBorder : theme.secondaryBorder,
            ...spacings.mv
          }}
        />
        {OTHER_LINKS.map((link, i) => {
          const isActive = activeLink === link.key

          return (
            <SettingsLink
              {...link}
              key={link.key}
              isActive={isActive}
              style={i === OTHER_LINKS.length - 1 ? spacings.mb0 : {}}
            />
          )
        })}
      </ScrollableWrapper>
    </View>
  )
}

export default React.memo(Sidebar)
