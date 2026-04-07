import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'

import NewsletterIcon from '@common/assets/svg/NewsletterIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import TosIcon from '@common/assets/svg/TosIcon'
import ControlOption from '@common/components/ControlOption'
import { APP_VERSION } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { openInTab } from '@common/utils/links'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const AboutSettingsScreen = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  const openTos = () => {
    navigate(ROUTES.settingsTerms)
  }

  const openNewsletter = async () => {
    await openInTab({ url: 'https://web3onfire.com/' })
  }

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent withScroll withBackButton title="About">
        <ControlOption
          style={spacings.mbTy}
          title={`v${APP_VERSION}`}
          description={''}
          renderIcon={<></>}
        />
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
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(AboutSettingsScreen)
