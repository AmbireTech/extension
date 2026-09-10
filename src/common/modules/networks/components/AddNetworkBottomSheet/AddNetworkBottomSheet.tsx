import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import ChainlistIcon from '@common/assets/svg/ChainlistIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import { isWeb } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import { openInTab } from '@common/utils/links'

import Option from '../Option'

const CHAINLIST_URL = 'https://chainlist.org/'

interface Props {
  sheetRef: ReturnType<typeof useModalize>['ref']
  closeBottomSheet: () => void
}

const AddNetworkBottomSheet = ({ sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()

  const handleGoToChainlist = useCallback(async () => {
    if (isWeb) {
      await openInTab({ url: CHAINLIST_URL, shouldCloseCurrentWindow: true })
      return
    }

    // Mobile has no tabs, so Chainlist opens in the in-app dapp WebView instead
    closeBottomSheet()
    navigate(ROUTES.dappWebView, { state: { url: CHAINLIST_URL, showBackButton: true } })
  }, [closeBottomSheet, navigate])

  const handleGoToSettings = useCallback(() => {
    closeBottomSheet()
    navigate(WEB_ROUTES.networksSettings)
  }, [closeBottomSheet, navigate])

  return (
    <BottomSheet
      id="dashboard-add-networks"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
    >
      <ModalHeader handleClose={closeBottomSheet} title={t('Add network')} />
      <Option
        renderIcon={<ChainlistIcon width={24} height={24} color={theme.secondaryText} />}
        title={t('Go to Chainlist')}
        text={t('Add any EVM network')}
        onPress={handleGoToChainlist}
      />
      <Option
        renderIcon={<SettingsIcon width={24} height={24} color={theme.secondaryText} />}
        title={t('Go to Settings')}
        text={t('Add network manually')}
        onPress={handleGoToSettings}
      />
    </BottomSheet>
  )
}

export default memo(AddNetworkBottomSheet)
