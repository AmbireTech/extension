import React, { useCallback } from 'react'

import SidePanelIcon from '@common/assets/svg/SidePanelIcon'
import LayoutWrapper from '@common/components/LayoutWrapper'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import SidePanelEmptyState from '@web/components/SidePanelEmptyState'

// Only dispatches to the controller, so no state is read and its updates don't re-render this
const selectNoState = () => null

/**
 * Shown instead of the wallet when the Firefox sidebar is opened (e.g. from Firefox's sidebar
 * switcher, which always lists the extension) while side panel mode is off.
 */
const SidePanelModeDisabledScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { dispatch: walletStateDispatch } = useController('WalletStateController', selectNoState)

  const enableSidePanelMode = useCallback(() => {
    walletStateDispatch({
      type: 'method',
      params: {
        method: 'setSidePanelModeEnabled',
        args: [true]
      }
    })
  }, [walletStateDispatch])

  return (
    <LayoutWrapper>
      {/* Centered in the panel, like the "make the sidebar wider" notice (SidePanelTooNarrowOverlay) */}
      <SidePanelEmptyState
        icon={<SidePanelIcon width={48} height={48} color={theme.primaryText} />}
        title={t('Side panel mode is off')}
        description={t(
          'Ambire currently opens as a popup from the toolbar. Turn on side panel mode to use the wallet here instead.'
        )}
        buttonText={t('Turn on side panel mode')}
        onButtonPress={enableSidePanelMode}
      />
    </LayoutWrapper>
  )
}

export default React.memo(SidePanelModeDisabledScreen)
