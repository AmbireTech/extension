import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

import AmbireLogoSquare from '@common/assets/svg/AmbireLogoSquare'
import BugIcon from '@common/assets/svg/BugIcon'
import DiscordIcon from '@common/assets/svg/DiscordIcon'
import HelpIcon from '@common/assets/svg/HelpIcon'
import LockIcon from '@common/assets/svg/LockIcon'
import MaximizeIcon from '@common/assets/svg/MaximizeIcon'
import TelegramIcon from '@common/assets/svg/TelegramIcon'
import TwitterIcon from '@common/assets/svg/TwitterIcon'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView/FooterGlassView'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'
import {
  TabLayoutContainer,
  tabLayoutWidths
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { DISCORD_URL, TELEGRAM_URL, TWITTER_URL } from '@web/constants/social'
import SettingsLink from '@web/modules/settings/components/SettingsLink'
import { SETTINGS_LINKS } from '@web/modules/settings/components/Sidebar/Sidebar'
import commonWebStyles from '@web/styles/utils/common'

import getStyles from './styles'

export const SOCIAL = [
  { Icon: TwitterIcon, url: TWITTER_URL, label: 'Twitter' },
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

const { isTab, isPopup } = getUiType()
const expandViewTooltipId = 'expand-view-tooltip'

const NavMenu = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme(getStyles)
  const { hasPasswordSecret } = useController('KeystoreController').state
  const { dispatch: mainDispatch } = useController('MainController')
  const handleLockAmbire = () => {
    mainDispatch({ type: 'method', params: { method: 'lock', args: [] } })
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
      header={<HeaderWithTitle title={t('Menu')} />}
      style={spacings.ph0}
      withHorizontalPadding={false}
    >
      <View style={[flexbox.flex1]}>
        <View style={[commonWebStyles.contentContainer, flexbox.flex1, spacings.pt]}>
          <View style={[spacings.ph, flexbox.flex1]}>
            <View
              style={[
                flexbox.directionRow,
                flexbox.justifySpaceBetween,
                flexbox.alignCenter,
                spacings.mb
              ]}
            >
              <Text fontSize={20} weight="medium">
                {t('Settings')}
              </Text>
              <View>
                {isPopup && (
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <Button
                      type="ghost2"
                      size="small"
                      hasBottomSpacing={false}
                      onPress={() =>
                        openInTab({
                          url: `tab.html#/${WEB_ROUTES.dashboard}`,
                          shouldCloseCurrentWindow: true
                        })
                      }
                    >
                      <MaximizeIcon
                        color={theme.iconPrimary}
                        dataSet={createGlobalTooltipDataSet({
                          id: expandViewTooltipId,
                          content: t('Expand view')
                        })}
                        width={24}
                        height={24}
                      />
                    </Button>
                  </View>
                )}
              </View>
            </View>
            {hasPasswordSecret && (
              <FooterGlassView isSimpleBlur={false}>
                <Button
                  text="Lock Ambire"
                  size="smaller"
                  childrenPosition="left"
                  onPress={handleLockAmbire}
                  hasBottomSpacing={false}
                >
                  <LockIcon style={spacings.mrTy} color="#fff" />
                </Button>
              </FooterGlassView>
            )}
            <ScrollView
              style={[flexbox.flex1, spacings.pbXl]}
              contentContainerStyle={{
                flexGrow: 1,
                paddingRight: 2,
                paddingBottom: 80
              }}
            >
              <View style={spacings.mbXl}>
                {SETTINGS_LINKS.map((link, i) => (
                  <SettingsLink {...link} key={link.key} isActive={false} />
                ))}
              </View>
              <View style={spacings.mbXl}>
                {OTHER_LINKS.map(({ Icon, ...link }) => (
                  <SettingsLink {...link} Icon={Icon} key={link.key} isActive={false} />
                ))}
              </View>
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
            </ScrollView>
          </View>
        </View>
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(NavMenu)
