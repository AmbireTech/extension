import React from 'react'
import { View } from 'react-native'

import { isMobile, isWeb } from '@common/config/env'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import PendingRequests from '@common/modules/action-requests/components/PendingRequests'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const selectVisibleUserRequests = (state: AllControllersMappingType['RequestsController']) =>
  state.visibleUserRequests

const ActionHeader = () => {
  const { theme } = useTheme()
  const { isCompactSidePanelLayout } = useCompactActionRequestLayout()
  const { state: visibleUserRequests } = useController(
    'RequestsController',
    selectVisibleUserRequests
  )
  return (
    <View>
      <View
        style={[
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          flexbox.alignCenter,
          isWeb && spacings.mhMi,
          isWeb && spacings.mtMi,
          isMobile ? spacings.phSm : spacings.ph,
          {
            borderRadius: 12,
            height: isMobile && visibleUserRequests.length < 2 ? 56 : 68,
            backgroundColor: theme.secondaryBackground,
            borderBottomWidth: isMobile ? 0 : 1,
            borderBottomColor: theme.neutral400
          }
        ]}
      >
        <Header.AccountDataDetailed />
        {/* A narrow panel needs the whole row for the account label and address */}
        {isWeb && !isCompactSidePanelLayout && <Header.Logo style={spacings.mlSm} />}
      </View>
      <PendingRequests style={[isWeb && spacings.mhMi]} />
    </View>
  )
}

export default React.memo(ActionHeader)
