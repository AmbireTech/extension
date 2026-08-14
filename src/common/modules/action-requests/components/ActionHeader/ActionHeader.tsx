import React from 'react'
import { View } from 'react-native'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import ActionsPagination from '@common/modules/action-requests/components/ActionsPagination'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const selectShouldShowActionsPagination = (
  state: AllControllersMappingType['RequestsController']
) =>
  state.visibleUserRequests.length > 1 &&
  !!state.currentUserRequest &&
  state.visibleUserRequests.some((request) => request.id === state.currentUserRequest?.id)

const ActionHeader = () => {
  const { theme } = useTheme()
  const { isCompactSidePanelLayout } = useCompactActionRequestLayout()
  const { state: shouldShowActionsPagination } = useController(
    'RequestsController',
    selectShouldShowActionsPagination
  )

  return (
    <View>
      <View
        style={[
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          flexbox.alignCenter,
          isWeb && spacings.mhMi,
          isWeb && (shouldShowActionsPagination ? spacings.mtMi : spacings.mvMi),
          isMobile ? spacings.phSm : spacings.ph,
          {
            borderRadius: 12,
            height: isMobile ? 56 : 68,
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
      <ActionsPagination />
    </View>
  )
}

export default React.memo(ActionHeader)
