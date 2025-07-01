import React, { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import NewsletterIcon from '@common/assets/svg/NewsletterIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import TosIcon from '@common/assets/svg/TosIcon'
import Badge from '@common/components/Badge'
import ControlOption from '@common/components/ControlOption'
import Text from '@common/components/Text'
import { APP_VERSION } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import { SOCIAL } from '@web/modules/router/components/NavMenu/NavMenu'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import SettingsPageHeader from '../../components/SettingsPageHeader'

const AboutSettingsScreen = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  useEffect(() => {
    setCurrentSettingsPage('about')
  }, [setCurrentSettingsPage])

  const openTos = () => {
    navigate(ROUTES.settingsTerms)
  }

  const openNewsletter = async () => {
    await openInTab({ url: 'https://web3onfire.com/' })
  }

  return (
    <>
      <SettingsPageHeader title="About Ambire Wallet" style={flexbox.justifyStart}>
        <Badge size="md" type="info" text={`v${APP_VERSION}`} style={spacings.ml} />
      </SettingsPageHeader>
      <ControlOption
        style={spacings.mbTy}
        title={t('Terms of Service')}
        description={t('Take a moment to review the full Terms of Service of Ambire Wallet.')}
        renderIcon={<TosIcon color={theme.primaryText} />}
        onPress={openTos}
      >
        <Pressable onPress={openTos}>
          <OpenIcon />
        </Pressable>
      </ControlOption>
      <ControlOption
        style={spacings.mbXl}
        title={t('Newsletter subscription')}
        description={t(
          'Sign up for our newsletter and be the first to know about our exciting new features and updates.'
        )}
        renderIcon={<NewsletterIcon color={theme.primaryText} />}
        onPress={openNewsletter}
      >
        <Pressable onPress={openNewsletter}>
          <OpenIcon />
        </Pressable>
      </ControlOption>
      <Text fontSize={20} weight="medium" style={spacings.mb}>
        {t('Follow us on')}
      </Text>
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        {SOCIAL.map(({ Icon, url, label }) => (
          <Pressable
            style={() => [
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.ph,
              spacings.pvTy,
              common.borderRadiusPrimary,
              spacings.mr2Xl
            ]}
            key={url}
            onPress={() => openInTab({ url, shouldCloseCurrentWindow: true })}
          >
            {({ hovered }: any) => (
              <>
                <Icon
                  style={spacings.mrSm}
                  color={hovered ? theme.iconSecondary : theme.iconPrimary}
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
    </>
  )
}

export default React.memo(AboutSettingsScreen)
