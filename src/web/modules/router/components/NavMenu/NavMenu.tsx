import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import DiscordIcon from '@common/assets/svg/DiscordIcon'
import LockFilledIcon from '@common/assets/svg/LockFilledIcon'
import TelegramIcon from '@common/assets/svg/TelegramIcon'
import TwitterIcon from '@common/assets/svg/TwitterIcon'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import DefaultWalletToggle from '@common/components/DefaultWalletToggle'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import getHeaderStyles from '@common/modules/header/components/Header/styles'
import HeaderBackButton from '@common/modules/header/components/HeaderBackButton'
import spacings from '@common/styles/spacings'
import { iconColors } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  tabLayoutWidths,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { createTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useWalletStateController from '@web/hooks/useWalletStateController'
import NavLink from '@web/modules/settings/components/SettingsLink'
import { SETTINGS_LINKS } from '@web/modules/settings/components/SettingsPage/Sidebar/Sidebar'
import commonWebStyles from '@web/styles/utils/common'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const TELEGRAM_URL = 'https://t.me/AmbireOfficial'
const TWITTER_URL = 'https://twitter.com/AmbireWallet'
const DISCORD_URL = 'https://discord.gg/QQb4xc4ksJ'

const SOCIAL = [
  { Icon: TwitterIcon, url: TWITTER_URL, label: 'Twitter' },
  { Icon: TelegramIcon, url: TELEGRAM_URL, label: 'Telegram' },
  { Icon: DiscordIcon, url: DISCORD_URL, label: 'Discord' }
]

const { isTab } = getUiType()

const NavMenu = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { styles, theme } = useTheme(getStyles)
  const { styles: headerStyles } = useTheme(getHeaderStyles)
  const { dispatch } = useBackgroundService()
  const walletState = useWalletStateController()

  const handleLockAmbire = () => {
    dispatch({
      type: 'KEYSTORE_CONTROLLER_LOCK'
    })

    dispatch({
      type: 'EMAIL_VAULT_CONTROLLER_CLEAN_MAGIC_AND_SESSION_KEYS'
    })
  }

  useEffect(() => {
    if (isTab) {
      navigate('accounts')
    }
  }, [navigate])

  return (
    <TabLayoutContainer
      hideFooterInPopup
      width="full"
      footer={<BackButton />}
      footerStyle={{ maxWidth: tabLayoutWidths.xl }}
      header={
        <Header withPopupBackButton mode="custom">
          <View style={[headerStyles.widthContainer, { maxWidth: tabLayoutWidths.xl }]}>
            <View style={[headerStyles.sideContainer, { width: 130 }]}>
              <HeaderBackButton />
            </View>
            <View style={headerStyles.containerInner}>
              <Text
                weight="medium"
                fontSize={isTab ? 24 : 20}
                style={headerStyles.title}
                numberOfLines={2}
              >
                {t('Menu')}
              </Text>
            </View>
            <View style={[headerStyles.sideContainer, { width: 130 }]}>
              <Button
                text="Lock Ambire"
                type="secondary"
                size="small"
                hasBottomSpacing={false}
                childrenPosition="left"
                style={{ minHeight: 32 }}
                onPress={handleLockAmbire}
              >
                <LockFilledIcon style={spacings.mrTy} color={theme.primary} />
              </Button>
            </View>
          </View>
        </Header>
      }
      style={spacings.ph0}
      withHorizontalPadding={false}
    >
      <View style={[flexbox.flex1]}>
        <View
          style={[
            flexbox.justifyCenter,
            {
              backgroundColor: walletState.isDefaultWallet ? theme.infoBackground : '#F6851B14'
            }
          ]}
        >
          <View style={[styles.defaultWalletContainer, commonWebStyles.contentContainer]}>
            <View style={[spacings.prXl, flexbox.flex1]}>
              {!walletState.isDefaultWallet && (
                <Text fontSize={14} weight="medium" color="#F6851B" numberOfLines={2}>
                  {t(
                    'Another wallet is set as default browser wallet for connecting with dApps. You can switch it to Ambire Wallet.'
                  )}
                </Text>
              )}
              {!!walletState.isDefaultWallet && (
                <Text fontSize={14} weight="medium" appearance="infoText" numberOfLines={2}>
                  {t(
                    'Ambire Wallet is set as your default browser wallet for connecting with dApps.'
                  )}
                </Text>
              )}
            </View>
            <DefaultWalletToggle
              isOn={!!walletState.isDefaultWallet}
              onToggle={() => {
                dispatch({
                  type: 'SET_IS_DEFAULT_WALLET',
                  params: { isDefaultWallet: !walletState.isDefaultWallet }
                })
              }}
            />
          </View>
        </View>

        <TabLayoutWrapperMainContent style={commonWebStyles.contentContainer}>
          <View style={[spacings.ph]}>
            <Text fontSize={20} weight="medium" style={[spacings.mbMd, spacings.pl]}>
              {t('Settings')}
            </Text>
            {SETTINGS_LINKS.map((link) => (
              <NavLink
                {...link}
                isActive={false}
                style={{
                  width: '100%'
                }}
              />
            ))}
          </View>
          <View style={styles.separatorWrapper}>
            <View style={styles.separator} />
          </View>
          <View style={[flexbox.directionRow, spacings.ph, spacings.pbLg]}>
            {SOCIAL.map(({ Icon, url, label }) => (
              <Pressable
                style={() => [
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.flex1,
                  spacings.ph,
                  spacings.pvTy,
                  common.borderRadiusPrimary
                ]}
                key={url}
                onPress={() => createTab(url)}
              >
                {({ hovered }: any) => (
                  <>
                    <Icon
                      style={spacings.mrSm}
                      color={hovered ? iconColors.secondary : iconColors.primary}
                    />
                    <Text
                      fontSize={14}
                      weight="medium"
                      appearance={hovered ? 'primaryText' : 'secondaryText'}
                    >
                      {label}
                    </Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        </TabLayoutWrapperMainContent>
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(NavMenu)
