import React from 'react'
import { View } from 'react-native'

import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import PendingRequests from '@common/modules/action-requests/components/PendingRequests'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const ActionHeader = () => {
  const { theme } = useTheme()
  const { isCompactSidePanelLayout } = useCompactActionRequestLayout()
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
      <PendingRequests style={[isWeb ? spacings.mhMi : spacings.mhSm, isMobile && spacings.mbSm]} />
    </View>
  )
}

export default React.memo(ActionHeader)
