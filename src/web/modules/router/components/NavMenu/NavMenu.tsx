import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import DashboardIcon from '@common/assets/svg/DashboardIcon'
import DiscordIcon from '@common/assets/svg/DiscordIcon'
import TelegramIcon from '@common/assets/svg/TelegramIcon'
import TwitterIcon from '@common/assets/svg/TwitterIcon'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import useNavigation from '@common/hooks/useNavigation'
import styles from '@common/modules/nav-menu/styles'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import commonWebStyles from '@web/styles/utils/common'

const TELEGRAM_URL = 'https://t.me/AmbireOfficial'
const TWITTER_URL = 'https://twitter.com/AmbireWallet'
const DISCORD_URL = 'https://discord.gg/QQb4xc4ksJ'

const NavMenu = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  const handleNavigate = useCallback((route: ROUTES) => navigate(route), [navigate])

  const menu = [{ Icon: DashboardIcon, name: t('Accounts'), route: ROUTES.accounts }]

  const social = [
    { Icon: DiscordIcon, url: DISCORD_URL },
    { Icon: TwitterIcon, url: TWITTER_URL },
    { Icon: TelegramIcon, url: TELEGRAM_URL }
  ]

  return (
    <Wrapper>
      <View style={[spacings.mhMi, spacings.mvTy]}>
        <View style={(flexboxStyles.directionRow, commonWebStyles.contentContainer)}>
          {menu.map(({ Icon, name, route }) => {
            return (
              <TouchableOpacity
                key={name}
                onPress={() => handleNavigate(route)}
                style={[styles.menuItem]}
              >
                {!!Icon && <Icon color={colors.black} />}
                <Text style={spacings.mlTy} color={colors.black}>
                  {name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* <View style={[flexboxStyles.directionRow, spacings.mtSm, spacings.mbMd]}>
          {social.map(({ Icon, url }) => (
            <TouchableOpacity key={url} onPress={() => Linking.openURL(url)}>
              <Icon style={spacings.mr} />
            </TouchableOpacity>
          ))}
        </View> */}

        {/* <AppVersion /> */}
      </View>
    </Wrapper>
  )
}

export default NavMenu
