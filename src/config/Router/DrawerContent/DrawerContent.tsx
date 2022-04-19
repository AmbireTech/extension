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
import Theme from './Theme'

const HELP_CENTER_URL = 'https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet'
const REPORT_ISSUE_URL = 'https://help.ambire.com/hc/en-us/requests/new'
const TELEGRAM_URL = 'https://t.me/AmbireWallet'
const TWITTER_URL = 'https://twitter.com/AmbireWallet'
const DISCORD_URL = 'https://discord.gg/nMBGJsb'

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { t } = useTranslation()
  const { navigation } = props

  const menu = [
    { Icon: DashboardIcon, name: t('Dashboard'), route: 'dashboard' },
    { Icon: EarnIcon, name: t('Earn'), route: 'earn' },
    { Icon: SendIcon, name: t('Send'), route: 'send' },
    { Icon: SwapIcon, name: t('Swap'), route: 'swap' },
    { Icon: TransferIcon, name: t('Transactions'), route: 'transactions' },
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

  const social = [
    { Icon: DiscordIcon, url: DISCORD_URL },
    { Icon: TwitterIcon, url: TWITTER_URL },
    { Icon: TelegramIcon, url: TELEGRAM_URL }
  ]

  const handleNavigate = (route: string) => {
    // FIXME: This makes the issue mentioned here even worse:
    // {@link https://github.com/AmbireTech/ambire-mobile-wallet/issues/419}
    // For routes that are Screens part of the main stack navigator (like the
    // `ReceiveScreen`), the drawer doesn't automatically close itself.
    // Therefore, always trigger a close after route change.
    // navigation.closeDrawer()

    navigation.navigate(route)
  }

  return (
    <DrawerContentScrollView
      {...props}
      alwaysBounceVertical={false}
      contentContainerStyle={spacings.mhLg}
      style={spacings.mvLg}
    >
      <Text fontSize={16} weight="medium" underline style={spacings.mbTy}>
        {t('Menu')}
      </Text>
      <View style={[spacings.mlTy, spacings.mbMd]}>
        {menu.map(({ Icon, name, route }) => (
          <TouchableOpacity
            key={name}
            onPress={() => handleNavigate(route)}
            style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mbTy]}
          >
            {Icon && <Icon />}
            <Text style={spacings.mlTy}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text fontSize={16} weight="medium" underline style={spacings.mbTy}>
        {t('Settings')}
      </Text>
      <View style={[spacings.mlTy, spacings.mbSm]}>
        <Passcode />
        <LocalAuth />
        <BiometricsSign />
        <AppLocking />
        <Theme />
        {settings.map((s) => (
          <TouchableOpacity key={s.name} onPress={() => handleNavigate(s.route)}>
            <Text style={spacings.mbSm}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {help.map(({ name, url }) => (
        <TouchableOpacity key={name} onPress={() => Linking.openURL(url)}>
          <Text fontSize={16} weight="regular" style={spacings.mbSm}>
            {name}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={[flexboxStyles.directionRow, spacings.mtSm, spacings.mbMd]}>
        {social.map(({ Icon, url }) => (
          <TouchableOpacity key={url} onPress={() => Linking.openURL(url)}>
            <Icon style={spacings.mr} />
          </TouchableOpacity>
        ))}
      </View>

      <AppVersion />
    </DrawerContentScrollView>
  )
}

export default DrawerContent
