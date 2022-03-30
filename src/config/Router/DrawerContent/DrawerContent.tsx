import React from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import DashboardIcon from '@assets/svg/DashboardIcon'
import DepositIcon from '@assets/svg/DepositIcon'
import DiscordIcon from '@assets/svg/DiscordIcon'
import EarnIcon from '@assets/svg/EarnIcon'
import SendIcon from '@assets/svg/SendIcon'
import SwapIcon from '@assets/svg/SwapIcon'
import TelegramIcon from '@assets/svg/TelegramIcon'
import TransferIcon from '@assets/svg/TransferIcon'
import TwitterIcon from '@assets/svg/TwitterIcon'
import { termsAndPrivacyURL } from '@modules/auth/constants/URLs'
import AppVersion from '@modules/common/components/AppVersion'
import Text from '@modules/common/components/Text'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'

import AppLocking from './AppLocking'
import BiometricsSign from './BiometricsSign'
import LocalAuth from './LocalAuth'
import Passcode from './Passcode'
import styles from './style'
import Theme from './Theme'

const HELP_CENTER_URL = 'https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet'
const REPORT_ISSUE_URL = 'https://help.ambire.com/hc/en-us/requests/new'

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { t } = useTranslation()
  const { navigation } = props

  const menu = [
    { Icon: DashboardIcon, name: t('Dashboard'), route: 'dashboard-tab' },
    { Icon: EarnIcon, name: t('Earn'), route: 'earn-tab' },
    { Icon: SendIcon, name: t('Send'), route: 'send-tab' },
    { Icon: SwapIcon, name: t('Swap'), route: 'swap-tab' },
    { Icon: TransferIcon, name: t('Transactions'), route: 'transactions-tab' },
    // TODO: Not implemented yet.
    // { Icon: CrossChainIcon, name: t('Cross-chain'), route: '' },
    { Icon: DepositIcon, name: t('Deposit'), route: 'receive' }
  ]

  const help = [
    { name: t('Help Center'), url: HELP_CENTER_URL },
    { name: t('Report an issue'), url: REPORT_ISSUE_URL },
    { name: t('Terms of Service'), url: termsAndPrivacyURL }
  ]

  const settings = [
    { name: t('Signers'), route: 'signers' }
    // TODO: Not implemented yet.
    // { name: t('Security'), route: 'security' }
  ]

  return (
    <DrawerContentScrollView
      {...props}
      alwaysBounceVertical={false}
      contentContainerStyle={spacings.mhLg}
      style={spacings.mvLg}
    >
      <Text fontSize={16} underline style={styles.menuTitle}>
        {t('Menu')}
      </Text>
      <View style={spacings.mbMd}>
        {menu.map(({ Icon, name, route }) => (
          <TouchableOpacity
            key={name}
            onPress={() => navigation.navigate(route)}
            style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mbTy]}
          >
            {Icon && <Icon />}
            <Text style={spacings.mlMi}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={spacings.mb}>
        <Text fontSize={16} underline style={styles.menuTitle}>
          {t('Settings')}
        </Text>
        <Passcode />
        <LocalAuth />
        <BiometricsSign />
        <AppLocking />
        <Theme />
        {settings.map((s) => (
          <TouchableOpacity key={s.name} onPress={() => navigation.navigate(s.route)}>
            <Text style={spacings.mbSm}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {help.map((h) => (
        <TouchableOpacity key={h.name} onPress={() => Linking.openURL(h.url)}>
          <Text fontSize={16} style={spacings.mbSm}>
            {h.name}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={[flexboxStyles.directionRow, spacings.mtSm, spacings.mbMd]}>
        <DiscordIcon style={spacings.mr} />
        <TwitterIcon style={spacings.mr} />
        <TelegramIcon />
      </View>

      <AppVersion />
    </DrawerContentScrollView>
  )
}

export default DrawerContent
