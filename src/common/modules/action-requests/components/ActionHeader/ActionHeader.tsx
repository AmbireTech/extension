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
  const { isNarrowWebLayout } = useCompactActionRequestLayout()
  // In a narrow view the header is inset like the content below it, so all edge spacings are equal
  const webMarginHorizontal = isNarrowWebLayout ? spacings.mhSm : spacings.mhMi
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
          isWeb && webMarginHorizontal,
          isWeb && (isNarrowWebLayout ? spacings.mtSm : spacings.mtMi),
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
      </View>
      <PendingRequests style={[isWeb && webMarginHorizontal]} />
    </View>
  )
}

export default React.memo(ActionHeader)
