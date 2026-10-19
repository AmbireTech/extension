import React, { useCallback, useEffect, useRef } from 'react'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import LayoutWrapper from '@common/components/LayoutWrapper'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { openInternalPageInTab } from '@common/utils/links/links'
import SidePanelEmptyState from '@web/components/SidePanelEmptyState'

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
      {/* Push content into the upper third of the panel */}
      <SidePanelEmptyState
        isInUpperThird
        icon={<AddCircularIcon width={48} height={48} color={theme.primaryText} />}
        title={t('No accounts found')}
        description={t(
          'Create a new account or import an existing one to load it in the side panel.'
        )}
        buttonText={t('Get started')}
        onButtonPress={openGetStarted}
      />
    </LayoutWrapper>
  )
}

export default React.memo(SidePanelNoAccountsScreen)
