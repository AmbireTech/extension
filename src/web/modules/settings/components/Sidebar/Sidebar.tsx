import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'

import AccountsIcon from '@common/assets/svg/AccountsIcon'
import AddressBookIcon from '@common/assets/svg/AddressBookIcon'
import AmbireLogoSquare from '@common/assets/svg/AmbireLogoSquare'
import BugIcon from '@common/assets/svg/BugIcon'
import CustomTokensIcon from '@common/assets/svg/CustomTokensIcon'
import DashboardIcon from '@common/assets/svg/DashboardIcon'
import HelpIcon from '@common/assets/svg/HelpIcon'
import KeyStoreSettingsIcon from '@common/assets/svg/KeyStoreSettingsIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import PasswordRecoverySettingsIcon from '@common/assets/svg/PasswordRecoverySettingsIcon'
import PrivacyIcon from '@common/assets/svg/PrivacyIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import SidebarSecurityIcon from '@common/assets/svg/SidebarSecurityIcon'
import SignedMessageIcon from '@common/assets/svg/SignedMessageIcon'
import TransactionHistoryIcon from '@common/assets/svg/TransactionHistoryIcon'
import GlassView from '@common/components/GlassView'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
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
    Icon: AccountsIcon,
    label: 'Accounts',
    path: ROUTES.accountsSettings
  },
  {
    key: 'address-book',
    Icon: AddressBookIcon,
    label: 'Address Book',
    path: ROUTES.addressBook
  },
  {
    key: 'networks',
    Icon: NetworksIcon,
    label: 'Networks',
    path: ROUTES.networksSettings
  },
  {
    key: 'transactions',
    Icon: TransactionHistoryIcon,
    label: 'Transaction history',
    path: ROUTES.transactions
  },
  {
    key: 'messages',
    Icon: SignedMessageIcon,
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
    Icon: KeyStoreSettingsIcon,
    label: 'Extension password',
    path: ROUTES.devicePasswordChange
  },
  {
    key: 'device-password-recovery',
    Icon: PasswordRecoverySettingsIcon,
    label: 'Password recovery',
    path: ROUTES.devicePasswordRecovery
  },
  {
    key: 'opt-outs',
    Icon: PrivacyIcon,
    label: 'Privacy opt-outs',
    path: ROUTES.optOuts
  },
  // Disabled for now - will be added in future releases
  // {
  //   key: 'email-vault',
  //   Icon: ({color }: SvgProps) => (
  //     <EmailVaultIcon strokeWidth={3.5} width={24} height={24} color={color} />
  //   )),
  //   label: 'Ambire Cloud (coming soon)',
  //   path: '/settings/email-vault'
  // },
  {
    key: 'manage-tokens',
    Icon: CustomTokensIcon,
    label: 'Custom tokens',
    path: ROUTES.manageTokens
  }
]

const OTHER_LINKS = [
  {
    key: 'about',
    Icon: AmbireLogoSquare,
    label: 'About Ambire',
    path: ROUTES.settingsAbout
  },
  {
    key: 'help-center',
    Icon: HelpIcon,
    label: 'Help center',
    path: 'https://help.ambire.com/en',
    isExternal: true
  },
  {
    key: 'report-issue',
    Icon: BugIcon,
    label: 'Report an issue',
    path: 'https://help.ambire.com/en',
    isExternal: true
  }
]

const Sidebar = ({ activeLink }: { activeLink?: string }) => {
  const { theme, styles } = useTheme(getStyles)
  const keystoreState = useController('KeystoreController').state
  const { state } = useRoute()
  const { navigate } = useNavigation()
  const [validBackRoute, setValidBackRoute] = useState<'dashboard' | 'transfer' | null>(null)
  const isTransferPreviousPage = state?.prevRoute?.pathname?.includes(ROUTES.transfer)
  const isDashboardPreviousPage = state?.prevRoute?.pathname.includes(WEB_ROUTES.dashboard)
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

  const glassViewStyle: ViewStyle & React.CSSProperties = {
    flexDirection: 'column',
    paddingLeft: SPACING_TY,
    paddingBottom: SPACING_TY,
    paddingRight: SPACING_TY,
    height: '100%',
    display: 'flex'
  }

  return (
    <View
      style={{
        ...spacings.pbLg,
        ...spacings.mlTy,
        ...spacings.mvTy,
        height: '100%',
        position: 'relative'
      }}
    >
      <GlassView cssStyle={glassViewStyle} style={glassViewStyle}>
        <View style={styles.settingsTitleWrapper}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <AmbireLogoSquare width={28} height={28} color={theme.neutral900} />
            <Text fontSize={20} style={spacings.mlMi} weight="semiBold">
              {t('Settings')}
            </Text>
          </View>
          {!!validBackRoute && (
            <Pressable
              style={{ width: 56, height: 56, ...flexbox.center }}
              onPress={() => {
                navigate(WEB_ROUTES.dashboard)
              }}
            >
              {({ hovered }: any) => (
                <DashboardIcon color={hovered ? theme.primaryText : theme.iconPrimary} />
              )}
            </Pressable>
          )}
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
                isSidebarLink
                {...link}
                key={link.key}
                isActive={isActive}
                style={i === SETTINGS_LINKS.length - 1 ? spacings.mb0 : {}}
              />
            )
          })}
          <View style={spacings.mbXl} />
          {OTHER_LINKS.map((link, i) => {
            const isActive = activeLink === link.key

            return (
              <SettingsLink
                isSidebarLink
                {...link}
                key={link.key}
                isActive={isActive}
                style={i === OTHER_LINKS.length - 1 ? spacings.mb0 : {}}
              />
            )
          })}
        </ScrollableWrapper>
      </GlassView>
    </View>
  )
}

export default React.memo(Sidebar)
