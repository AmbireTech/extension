import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AccountsIcon from '@common/assets/svg/AccountsIcon'
// import AddressBookIcon from '@common/assets/svg/AddressBookIcon'
import AmbireLogoSquare from '@common/assets/svg/AmbireLogoSquare'
import BugIcon from '@common/assets/svg/BugIcon'
// import CustomTokensIcon from '@common/assets/svg/CustomTokensIcon'
import DiscordIcon from '@common/assets/svg/DiscordIcon'
import HelpIcon from '@common/assets/svg/HelpIcon'
// import KeyStoreSettingsIcon from '@common/assets/svg/KeyStoreSettingsIcon'
// import NetworksIcon from '@common/assets/svg/NetworksIcon'
// import PasswordRecoverySettingsIcon from '@common/assets/svg/PasswordRecoverySettingsIcon'
// import PrivacyIcon from '@common/assets/svg/PrivacyIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
// import SidebarSecurityIcon from '@common/assets/svg/SidebarSecurityIcon'
// import SignedMessageIcon from '@common/assets/svg/SignedMessageIcon'
import TelegramIcon from '@common/assets/svg/TelegramIcon'
// import TransactionHistoryIcon from '@common/assets/svg/TransactionHistoryIcon'
import TwitterIcon from '@common/assets/svg/TwitterIcon'
import { DISCORD_URL, TELEGRAM_URL, TWITTER_URL } from '@common/constants/social'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import SettingsLink from '@common/modules/settings/components/SettingsLink'
import spacings from '@common/styles/spacings'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

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
    Icon: AccountsIcon,
    label: 'Accounts',
    path: ROUTES.accountsSettings
  }
  // {
  //   key: 'address-book',
  //   Icon: AddressBookIcon,
  //   label: 'Address Book',
  //   path: ROUTES.addressBook
  // },
  // {
  //   key: 'networks',
  //   Icon: NetworksIcon,
  //   label: 'Networks',
  //   path: ROUTES.networksSettings
  // },
  // {
  //   key: 'transactions',
  //   Icon: TransactionHistoryIcon,
  //   label: 'Transaction history',
  //   path: ROUTES.transactions
  // },
  // {
  //   key: 'messages',
  //   Icon: SignedMessageIcon,
  //   label: 'Signed messages',
  //   path: ROUTES.signedMessages
  // },
  // {
  //   key: 'recovery-phrases',
  //   Icon: SidebarSecurityIcon,
  //   label: 'Recovery phrases',
  //   path: ROUTES.recoveryPhrasesSettings
  // },
  // {
  //   key: 'device-password-change',
  //   Icon: KeyStoreSettingsIcon,
  //   label: 'Extension password',
  //   path: ROUTES.devicePasswordChange
  // },
  // {
  //   key: 'device-password-recovery',
  //   Icon: PasswordRecoverySettingsIcon,
  //   label: 'Password recovery',
  //   path: ROUTES.devicePasswordRecovery
  // },
  // {
  //   key: 'opt-outs',
  //   Icon: PrivacyIcon,
  //   label: 'Privacy opt-outs',
  //   path: ROUTES.optOuts
  // },
  // Disabled for now - will be added in future releases
  // {
  //   key: 'email-vault',
  //   Icon: ({color }: SvgProps) => (
  //     <EmailVaultIcon strokeWidth={3.5} width={24} height={24} color={color} />
  //   )),
  //   label: 'Ambire Cloud (coming soon)',
  //   path: '/settings/email-vault'
  // },
  // {
  //   key: 'manage-tokens',
  //   Icon: CustomTokensIcon,
  //   label: 'Custom tokens',
  //   path: ROUTES.manageTokens
  // }
]

export const SOCIAL = [
  { Icon: TwitterIcon, url: TWITTER_URL, label: 'X' },
  { Icon: TelegramIcon, url: TELEGRAM_URL, label: 'Telegram' },
  { Icon: DiscordIcon, url: DISCORD_URL, label: 'Discord' }
]
const OTHER_LINKS = [
  {
    key: 'help-center',
    Icon: React.memo(HelpIcon),
    label: 'Help center',
    path: 'https://help.ambire.com/en',
    isExternal: true
  },
  {
    key: 'report-issue',
    Icon: React.memo(BugIcon),
    label: 'Report an issue',
    path: 'https://help.ambire.com/en',
    isExternal: true
  },
  {
    key: 'about',
    Icon: AmbireLogoSquare,
    label: 'About',
    path: ROUTES.settingsAbout
  }
]

const NavMenu = () => {
  const { t } = useTranslation()
  const { theme } = useTheme(getStyles)

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent withScroll title={t('Menu')} withBackButton>
        <View
          style={[
            spacings.pbSm,
            {
              borderBottomWidth: 1,
              borderBottomColor: theme.primaryBorder
            }
          ]}
        >
          {SETTINGS_LINKS.map(({ Icon, ...link }) => (
            <SettingsLink {...link} Icon={Icon} key={link.key} isActive={false} />
          ))}
        </View>
        <View
          style={[
            spacings.pvSm,
            {
              borderBottomWidth: 1,
              borderBottomColor: theme.primaryBorder
            }
          ]}
        >
          {OTHER_LINKS.map(({ Icon, ...link }) => (
            <SettingsLink {...link} Icon={Icon} key={link.key} isActive={false} />
          ))}
        </View>
        <View style={[spacings.ptSm]}>
          {SOCIAL.map(({ Icon, ...link }) => (
            <SettingsLink
              {...link}
              Icon={Icon}
              key={link.url}
              path={link.url}
              isActive={false}
              isExternal
            />
          ))}
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(NavMenu)
