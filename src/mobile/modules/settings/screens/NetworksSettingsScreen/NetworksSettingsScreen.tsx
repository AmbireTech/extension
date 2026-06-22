import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import AddIcon from '@common/assets/svg/AddIcon'
import ChainlistIcon from '@common/assets/svg/ChainlistIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import { isWeb } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import NetworkForm from '@common/modules/settings/components/Networks/NetworkForm'
import spacings from '@common/styles/spacings'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import NetworkSettings from '@mobile/modules/network-settings/components'

const NetworksSettingsScreen = () => {
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { search: searchParams, pathname } = useRoute()
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  const shouldOpenBottomSheet = useMemo(() => {
    const parsedSearchParams = new URLSearchParams(searchParams)

    return parsedSearchParams.has('addNetwork')
  }, [searchParams])

  const isInitialConfig = useMemo(
    () => pathname?.includes(ROUTES.networksConfiguration),
    [pathname]
  )

  const navigateToChainlist = useCallback(async () => {
    navigate(ROUTES.dappWebView, { state: { url: 'https://chainlist.org/', showBackButton: true } })
  }, [navigate])

  return (
    <MobileLayoutContainer
      footer={
        <>
          {!isInitialConfig && (
            <Button
              type="primary"
              size="small"
              text={t('Add network from Chainlist')}
              testID="add-network-from-chainlist"
              onPress={navigateToChainlist}
              style={{ height: 48, ...spacings.mbTy }}
              childrenPosition="left"
            >
              <ChainlistIcon width={24} height={24} style={spacings.mrTy} />
            </Button>
          )}
          <Button
            type="secondary"
            size="small"
            text={t('Add network manually')}
            testID="add-network-manually"
            onPress={openBottomSheet as any}
            hasBottomSpacing={false}
            style={{ height: 48 }}
            childrenPosition="left"
          >
            <AddIcon style={spacings.mrTy} />
          </Button>
        </>
      }
    >
      <MobileLayoutWrapperMainContent withBackButton title="Networks">
        <NetworkSettings />

        <BottomSheet
          id="add-new-network"
          sheetRef={sheetRef}
          closeBottomSheet={closeBottomSheet}
          scrollViewProps={
            isWeb
              ? {
                  scrollEnabled: false,
                  contentContainerStyle: { flex: 1 }
                }
              : {}
          }
          containerInnerWrapperStyles={isWeb ? { flex: 1 } : {}}
          style={
            isWeb ? { ...spacings.ph0, ...spacings.pv0, overflow: 'hidden', maxWidth: 880 } : {}
          }
          autoOpen={shouldOpenBottomSheet}
        >
          <NetworkForm onCancel={closeBottomSheet} onSaved={closeBottomSheet} />
        </BottomSheet>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(NetworksSettingsScreen)
