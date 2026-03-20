import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AmbireLogoSquare from '@common/assets/svg/AmbireLogoSquare'
import BugIcon from '@common/assets/svg/BugIcon'
import DiscordIcon from '@common/assets/svg/DiscordIcon'
import HelpIcon from '@common/assets/svg/HelpIcon'
import LockIcon from '@common/assets/svg/LockIcon'
import MaximizeIcon from '@common/assets/svg/MaximizeIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import TelegramIcon from '@common/assets/svg/TelegramIcon'
import TwitterIcon from '@common/assets/svg/TwitterIcon'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'
import {
  TabLayoutContainer,
  tabLayoutWidths
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { DISCORD_URL, TELEGRAM_URL, TWITTER_URL } from '@web/constants/social'
import {
  AUTO_LOCK_TIMES,
  getAutoLockLabel
} from '@web/extension-services/background/controllers/auto-lock'
import SettingsLink from '@web/modules/settings/components/SettingsLink'
import commonWebStyles from '@web/styles/utils/common'

import getStyles from './styles'

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

const { isTab, isPopup } = getUiType()
const expandViewTooltipId = 'expand-view-tooltip'

const AUTO_LOCK_OPTIONS = [
  {
    value: AUTO_LOCK_TIMES.never,
    label: getAutoLockLabel(AUTO_LOCK_TIMES.never)
  },
  {
    value: AUTO_LOCK_TIMES._7days,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._7days)
  },
  {
    value: AUTO_LOCK_TIMES._1day,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._1day)
  },
  {
    value: AUTO_LOCK_TIMES._8hours,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._8hours)
  },
  {
    value: AUTO_LOCK_TIMES._1hour,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._1hour)
  },
  {
    value: AUTO_LOCK_TIMES._10minutes,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._10minutes)
  }
]

const NavMenu = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme(getStyles)
  const { dispatch: mainDispatch } = useController('MainController')
  const handleLockAmbire = () => {
    mainDispatch({ type: 'method', params: { method: 'lock', args: [] } })
  }

  const {
    state: { autoLockTime }
  } = useController('AutoLockController')

  const [bindLockAnim, lockAnimStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: hexToRgba(theme.secondaryBackground, 0),
      to: theme.secondaryBackground
    }
  })

  const selectedOption = useMemo(() => {
    return AUTO_LOCK_OPTIONS.find((option) => option.value === autoLockTime) || AUTO_LOCK_OPTIONS[0]
  }, [autoLockTime])

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
        <HeaderWithTitle title={t('Menu')}>
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
        </HeaderWithTitle>
      }
      style={spacings.ph0}
      withHorizontalPadding={false}
    >
      <View style={[flexbox.flex1]}>
        <View style={[commonWebStyles.contentContainer, flexbox.flex1]}>
          <View style={[flexbox.flex1]}>
            <View
              style={[
                spacings.pbSm,
                spacings.phSm,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.neutral100
                }
              ]}
            >
              <SettingsLink
                Icon={SettingsIcon}
                label="Settings"
                path={ROUTES.generalSettings}
                isActive={false}
                key="settings"
              />
            </View>
            <View
              style={[
                spacings.pvSm,
                spacings.phSm,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.neutral100
                }
              ]}
            >
              {OTHER_LINKS.map(({ Icon, ...link }) => (
                <SettingsLink {...link} Icon={Icon} key={link.key} isActive={false} />
              ))}
            </View>
            <View
              style={[
                spacings.pvSm,
                spacings.phSm,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.neutral100
                }
              ]}
            >
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

            <View style={[spacings.ptSm, spacings.phSm]}>
              <AnimatedPressable
                onPress={handleLockAmbire}
                style={[
                  flexbox.directionRow,
                  flexbox.justifySpaceBetween,
                  flexbox.alignCenter,
                  spacings.phSm,
                  spacings.pv,
                  flexbox.flex1,
                  {
                    borderRadius: BORDER_RADIUS_PRIMARY
                  },
                  lockAnimStyle
                ]}
                {...bindLockAnim}
              >
                <View style={flexbox.directionRow}>
                  <LockIcon width={24} height={24} color={theme.iconPrimary} />
                  <Text style={spacings.mlSm} weight="medium">
                    {t('Lock Wallet')}
                  </Text>
                </View>

                <Text>{selectedOption?.label || ''}</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(NavMenu)
