import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, TouchableOpacity, View } from 'react-native'

import DashboardIcon from '@assets/svg/DashboardIcon'
import DepositIcon from '@assets/svg/DepositIcon'
import DiscordIcon from '@assets/svg/DiscordIcon'
import EarnIcon from '@assets/svg/EarnIcon'
import GasTankIcon from '@assets/svg/GasTankIcon'
import LockIcon from '@assets/svg/LockIcon'
import SendIcon from '@assets/svg/SendIcon'
import SwapIcon from '@assets/svg/SwapIcon'
import TelegramIcon from '@assets/svg/TelegramIcon'
import TransferIcon from '@assets/svg/TransferIcon'
import TwitterIcon from '@assets/svg/TwitterIcon'
import AppVersion from '@common/components/AppVersion'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { isAndroid, isiOS, isWeb } from '@config/env'
import { termsAndPrivacyURL } from '@modules/auth/constants/URLs'
import useVault from '@modules/vault/hooks/useVault'

import { ROUTES } from '../routesConfig'
import ConnectedDapps from './ConnectedDapps'
import GasIndicator from './GasIndicator'
import ManageVaultLockButton from './ManageVaultLockButton'
import styles from './styles'
import Theme from './Theme'

const HELP_CENTER_URL = 'https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet'
const REPORT_ISSUE_URL = 'https://help.ambire.com/hc/en-us/requests/new'
const TELEGRAM_URL = 'https://t.me/AmbireWallet'
const TWITTER_URL = 'https://twitter.com/AmbireWallet'
const DISCORD_URL = 'https://discord.gg/nMBGJsb'

const DrawerContent = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { pathname } = useRoute()
  const { lockVault } = useVault()

  const handleNavigate = useCallback((route: ROUTES) => navigate(route), [navigate])

  const menu = [
    { Icon: DashboardIcon, name: t('Dashboard'), route: ROUTES.dashboard },
    // TODO: Temporary disabled for iOS since v1.9.2 as part of the Apple app review feedback
    ...(!isiOS ? [{ Icon: EarnIcon, name: t('Earn'), route: ROUTES.earn }] : []),
    { Icon: SendIcon, name: t('Send'), route: ROUTES.send },
    // TODO: Temporary disabled for iOS since v1.6.0 as part of the Apple app review feedback
    ...(isAndroid ? [{ Icon: SwapIcon, name: t('Swap'), route: ROUTES.swap }] : []),
    { Icon: TransferIcon, name: t('Transactions'), route: ROUTES.transactions },
    // TODO: Not implemented yet.
    // { Icon: CrossChainIcon, name: t('Cross-chain'), route: '' },
    { Icon: DepositIcon, name: t('Deposit'), route: ROUTES.receive },
    { Icon: GasTankIcon, name: t('Gas Tank'), route: ROUTES.gasTank }
  ]

  const help = [
    { name: t('Help Center'), url: HELP_CENTER_URL },
    { name: t('Report an issue'), url: REPORT_ISSUE_URL },
    { name: t('Terms of Service'), url: termsAndPrivacyURL }
  ]

  const settings = [
    { name: t('Signers'), route: ROUTES.signers }
    // TODO: Not implemented yet.
    // { name: t('Security'), route: 'security' }
  ]

  const social = [
    { Icon: DiscordIcon, url: DISCORD_URL },
    { Icon: TwitterIcon, url: TWITTER_URL },
    { Icon: TelegramIcon, url: TELEGRAM_URL }
  ]

  return (
    <GradientBackgroundWrapper>
      <Wrapper>
        <View
          style={[
            flexboxStyles.directionRow,
            flexboxStyles.justifySpaceBetween,
            flexboxStyles.alignCenter,
            spacings.mbMd
          ]}
        >
          <GasIndicator handleNavigate={handleNavigate} />

          <TouchableOpacity
            style={[styles.lockBtn, flexboxStyles.directionRow, flexboxStyles.alignCenter]}
            onPress={() => lockVault()}
          >
            <LockIcon height={20} color={colors.chetwode} />
            <Text color={colors.chetwode} weight="regular">
              {t('Lock')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={spacings.mh}>
          <View style={flexboxStyles.directionRow}>
            <View style={flexboxStyles.flex1}>
              <Text fontSize={16} weight="medium" underline style={spacings.mbTy}>
                {t('Menu')}
              </Text>
              <View style={[spacings.mlTy, spacings.mbMd]}>
                {menu.map(({ Icon, name, route }) => {
                  const isActive = pathname === route
                  return (
                    <TouchableOpacity
                      key={name}
                      onPress={() => handleNavigate(route)}
                      style={[styles.menuItem]}
                    >
                      {isActive && <View style={styles.activeMenuItem} />}
                      {!!Icon && <Icon color={isActive ? colors.titan : colors.titan_50} />}
                      <Text style={spacings.mlTy} color={isActive ? colors.titan : colors.titan_50}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
            <View style={[flexboxStyles.flex1, spacings.pl]}>
              <Text fontSize={16} weight="medium" underline style={spacings.mbTy}>
                {t('Settings')}
              </Text>
              <View style={[spacings.mlTy, spacings.mbSm]}>
                <ConnectedDapps />
                {!isWeb && <ManageVaultLockButton handleNavigate={handleNavigate} />}
                <Theme />
                {settings.map((s) => (
                  <TouchableOpacity key={s.name} onPress={() => handleNavigate(s.route)}>
                    <Text style={spacings.mbSm} color={colors.titan_50}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
        </View>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default DrawerContent
