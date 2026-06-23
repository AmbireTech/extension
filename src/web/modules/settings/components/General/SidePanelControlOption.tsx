import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import SidePanelIcon from '@common/assets/svg/SidePanelIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { isSidePanelSupported } from '@web/utils/sidePanel'

const SidePanelControlOption = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    state: { isSidePanelModeEnabled },
    dispatch: walletStateDispatch
  } = useController('WalletStateController')

  const handleToggleSidePanelMode = useCallback(() => {
    walletStateDispatch({
      type: 'method',
      params: {
        method: 'setSidePanelModeEnabled',
        args: [!isSidePanelModeEnabled]
      }
    })
  }, [walletStateDispatch, isSidePanelModeEnabled])

  if (!isSidePanelSupported()) return null

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Side panel mode')}
      description={t('Open the wallet in the browser side panel instead of a popup.')}
      renderIcon={<SidePanelIcon color={theme.iconPrimary} />}
    >
      <FatToggle isOn={isSidePanelModeEnabled} onToggle={handleToggleSidePanelMode} />
    </ControlOption>
  )
}

export default React.memo(SidePanelControlOption)
