import React, { useCallback, useEffect, useRef } from 'react'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import Button from '@common/components/Button'
import LayoutWrapper from '@common/components/LayoutWrapper'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { openInternalPageInTab } from '@common/utils/links/links'

/**
 * Side-panel empty state when the wallet has no accounts.
 * Full onboarding stays tab-only; this screen keeps the panel from going blank
 * and opens get-started in a browser tab (same as TabOnlyRoute used to).
 */
const SidePanelNoAccountsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { authStatus } = useAuth()
  const { navigate } = useNavigation()
  const hasOpenedGetStartedTabRef = useRef(false)

  const openGetStarted = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    openInternalPageInTab({
      route: WEB_ROUTES.getStarted,
      // Keep the side panel open on this placeholder page.
      shouldCloseCurrentWindow: false
    })
  }, [])

  useEffect(() => {
    if (authStatus === AUTH_STATUS.AUTHENTICATED) {
      navigate(WEB_ROUTES.dashboard)
    }
  }, [authStatus, navigate])

  useEffect(() => {
    if (authStatus === AUTH_STATUS.AUTHENTICATED) return
    if (hasOpenedGetStartedTabRef.current) return
    hasOpenedGetStartedTabRef.current = true
    openGetStarted()
  }, [authStatus, openGetStarted])

  if (authStatus === AUTH_STATUS.AUTHENTICATED || authStatus === AUTH_STATUS.LOADING) {
    return null
  }

  return (
    <LayoutWrapper>
      <View style={[flexbox.flex1, flexbox.alignCenter, spacings.ph]}>
        {/* Push content into the upper third of the panel */}
        <View style={{ flex: 0.22 }} />
        <AddCircularIcon width={48} height={48} color={theme.primaryText} />
        <Text fontSize={20} weight="medium" style={[spacings.mtMd, text.center]}>
          {t('No accounts found')}
        </Text>
        <Text
          fontSize={16}
          weight="regular"
          appearance="secondaryText"
          style={[spacings.mtTy, text.center]}
        >
          {t('Create a new account or import an existing one to load it in the side panel.')}
        </Text>
        <Button
          type="primary"
          text={t('Get started')}
          onPress={openGetStarted}
          hasBottomSpacing={false}
          style={[spacings.mtLg, { alignSelf: 'center', minWidth: 180 }]}
        />
        <View style={{ flex: 0.78 }} />
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(SidePanelNoAccountsScreen)
