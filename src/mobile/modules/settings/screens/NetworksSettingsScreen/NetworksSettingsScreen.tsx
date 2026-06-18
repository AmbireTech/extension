import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import AddIcon from '@common/assets/svg/AddIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import { isWeb } from '@common/config/env'
import useRoute from '@common/hooks/useRoute'
import NetworkForm from '@common/modules/settings/components/Networks/NetworkForm'
import spacings from '@common/styles/spacings'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import NetworkSettings from '@mobile/modules/network-settings/components'

const NetworksSettingsScreen = () => {
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { search: searchParams } = useRoute()
  const { t } = useTranslation()

  const shouldOpenBottomSheet = useMemo(() => {
    const parsedSearchParams = new URLSearchParams(searchParams)

    return parsedSearchParams.has('addNetwork')
  }, [searchParams])

  return (
    <MobileLayoutContainer
      footer={
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
