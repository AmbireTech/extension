import usePrevious from 'ambire-common/src/hooks/usePrevious'
import React, { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, TouchableOpacity, View } from 'react-native'

import DAppsIcon from '@common/assets/svg/DAppsIcon'
import DashboardIcon from '@common/assets/svg/DashboardIcon'
import DepositIcon from '@common/assets/svg/DepositIcon'
import DiscordIcon from '@common/assets/svg/DiscordIcon'
import EarnIcon from '@common/assets/svg/EarnIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import SwapIcon from '@common/assets/svg/SwapIcon'
import TelegramIcon from '@common/assets/svg/TelegramIcon'
import TransferIcon from '@common/assets/svg/TransferIcon'
import TwitterIcon from '@common/assets/svg/TwitterIcon'
import AppVersion from '@common/components/AppVersion'
import Text from '@common/components/Text'
import { termsAndPrivacyURL } from '@common/modules/auth/constants/URLs'
import GasIndicator from '@common/modules/nav-menu/components/GasIndicator'
import ManageVaultLockButton from '@common/modules/nav-menu/components/ManageVaultLockButton'
// import Theme from '@common/modules/nav-menu/components/Theme'
import styles from '@common/modules/nav-menu/styles'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import useGetSelectedRoute from '@mobile/modules/router/hooks/useGetSelectedRoute'
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  useDrawerStatus
} from '@react-navigation/drawer'

const HELP_CENTER_URL = 'https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet'
const REPORT_ISSUE_URL = 'https://help.ambire.com/hc/en-us/requests/new'
const TELEGRAM_URL = 'https://t.me/AmbireOfficial'
const TWITTER_URL = 'https://twitter.com/AmbireWallet'
const DISCORD_URL = 'https://www.ambire.com/discord'

const SideNavMenu: React.FC<DrawerContentComponentProps> = (props) => {
  const { t } = useTranslation()
  const { navigation } = props
  const { name: routeName } = useGetSelectedRoute()
  const scrollRef: any = useRef(null)

  const isDrawerOpen = useDrawerStatus() === 'open'
  const prevIsDrawerOpen = usePrevious(isDrawerOpen)
  // Resets drawer scroll position on every drawer close
  useEffect(() => {
    if (prevIsDrawerOpen && !isDrawerOpen) {
      scrollRef?.current?.scrollTo({ x: 0, y: 0 })
    }
  }, [isDrawerOpen, prevIsDrawerOpen])

  const handleNavigate = useCallback(
    (route: string) => {
      // For routes that are Screens part of the main stack navigator (like the
      // Receive screen and all Settings screens), the drawer doesn't
      // automatically close itself.
      // Therefore, always trigger a close before a route change
      navigation.closeDrawer()
      navigation.navigate(route)
    },
    [navigation]
  )

  const menu = [
    { Icon: DashboardIcon, name: t('Dashboard'), route: ROUTES.dashboard },
    { Icon: EarnIcon, name: t('Earn'), route: ROUTES.earn },
    { Icon: SendIcon, name: t('Send'), route: ROUTES.send },
    { Icon: SwapIcon, name: t('Swap'), route: ROUTES.swap },
    { Icon: TransferIcon, name: t('Transactions'), route: ROUTES.transactions },
    // TODO: Not implemented yet.
    // { Icon: CrossChainIcon, name: t('Cross-chain'), route: '' },
    { Icon: DepositIcon, name: t('Deposit'), route: ROUTES.receive },
    { Icon: GasTankIcon, name: t('Gas Tank'), route: ROUTES.gasTank },
    { Icon: DAppsIcon, name: t('dApps'), route: ROUTES.dappsCatalog }
  ]

  const help = [
    { name: t('Help Center'), url: HELP_CENTER_URL },
    { name: t('Report an issue'), url: REPORT_ISSUE_URL },
    { name: t('Terms of Service'), url: termsAndPrivacyURL }
  ]

  const PRIVACY_POLICY_URL = 'https://www.ambire.com/privacy-policy'

  const additionalInfo = [
    { name: t('Data Deletion Policy'), route: ROUTES.dataDeletionPolicy },
    { name: t('Backup Account'), route: ROUTES.backup },
    { name: t('Replay Onboarding'), route: ROUTES.onboardingOnFirstLogin }
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
    <DrawerContentScrollView
      {...props}
      alwaysBounceVertical={false}
      style={spacings.mt}
      ref={scrollRef}
    >
      <View style={[spacings.mh, spacings.mbSm, spacings.mbTy]}>
        <GasIndicator handleNavigate={handleNavigate} />
      </View>
      <View style={spacings.mhLg}>
        <Text fontSize={16} weight="medium" underline style={spacings.mbTy}>
          {t('Menu')}
        </Text>
        <View style={[spacings.mlTy, spacings.mbMd]}>
          {menu.map(({ Icon, name, route }) => {
            const isActive = routeName.includes(route)

            return (
              <TouchableOpacity
                key={name}
                onPress={() => handleNavigate(route)}
                style={[styles.menuItem]}
              >
                {isActive && <View style={styles.activeMenuItem} />}
                {!!Icon && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <Icon color={isActive ? colors.titan : colors.titan_50} />
                  </View>
                )}
                <Text style={spacings.mlTy} color={isActive ? colors.titan : colors.titan_50}>
                  {name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text fontSize={16} weight="medium" underline style={spacings.mbTy}>
          {t('Settings')}
        </Text>
        <View style={[spacings.mlTy, spacings.mbSm]}>
          <ManageVaultLockButton handleNavigate={handleNavigate} />
          {/* TODO: Temporary disabled since v3.1.1 as part of the Apple app review feedback */}
          {/* <Theme /> */}
          {settings.map((s) => (
            <TouchableOpacity
              key={s.name}
              onPress={() => handleNavigate(s.route)}
              style={spacings.mbSm}
            >
              <Text color={colors.titan_50}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {help.map(({ name, url }) => (
          <TouchableOpacity key={name} onPress={() => Linking.openURL(url)} style={spacings.mbSm}>
            <Text fontSize={16} weight="regular">
              {name}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={[spacings.mlTy, spacings.mbSm]}>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={spacings.mbSm} color={colors.titan_50}>
              {t('Privacy Policy')}
            </Text>
          </TouchableOpacity>
          {additionalInfo.map(({ name, route }) => (
            <TouchableOpacity key={name} onPress={() => handleNavigate(route)}>
              <Text style={spacings.mbSm} color={colors.titan_50}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[flexboxStyles.directionRow, spacings.mtSm, spacings.mbMd]}>
          {social.map(({ Icon, url }) => (
            <TouchableOpacity key={url} onPress={() => Linking.openURL(url)}>
              <Icon style={spacings.mr} />
            </TouchableOpacity>
          ))}
        </View>

        <AppVersion />
      </View>
    </DrawerContentScrollView>
  )
}

export default SideNavMenu
