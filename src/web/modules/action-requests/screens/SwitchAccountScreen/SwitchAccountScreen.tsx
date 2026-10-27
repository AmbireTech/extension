import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import DAppConnectHeader from '@common/modules/action-requests/components/DAppConnect/DAppConnectHeader'
import getStyles from '@common/modules/action-requests/components/DAppConnect/styles'
import SwitchAccountBody from '@common/modules/action-requests/components/SwitchAccount/SwitchAccountBody'
import useSwitchAccount from '@common/modules/action-requests/hooks/useSwitchAccount'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const SwitchAccountScreen = () => {
  const { isNarrowWebLayout } = useCompactLayout()
  const { minHeightSize } = useWindowSize()
  const {
    t,
    account,
    isAuthorizing,
    isRequestBroken,
    nextAccount,
    nextAccountData,
    nextRequestType,
    dAppData,
    handleDenyButtonPress,
    handleAuthorizeButtonPress,
    responsiveSizeMultiplier
  } = useSwitchAccount()
  const { styles } = useTheme(getStyles)

  return (
    <TabLayoutContainer
      width="full"
      header={<ActionHeader />}
      renderDirectChildren={() => (
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handleAuthorizeButtonPress}
          resolveButtonText={isAuthorizing ? t('Switching...') : t('Switch Account')}
          resolveDisabled={isAuthorizing || isRequestBroken}
          rejectButtonText={t('Deny')}
          resolveButtonTestID="switch-account-button"
          rejectButtonTestID="switch-account-deny-button"
        />
      )}
      style={{
        marginTop: isNarrowWebLayout || minHeightSize(650) ? 0 : SPACING * responsiveSizeMultiplier
      }}
    >
      <TabLayoutWrapperMainContent
        contentContainerStyle={
          // In a narrow view the header and the footer already space the content like on mobile
          isNarrowWebLayout
            ? [spacings.mt0, spacings.pbSm]
            : { ...spacings.pb4Xl, ...spacings.mtMi }
        }
      >
        <View style={styles.container}>
          {isAuthorizing ? (
            <SkeletonLoader width="100%" height={450} appearance="primaryBackground" />
          ) : (
            <View
              style={[
                styles.content,
                {
                  marginBottom: minHeightSize(650) ? SPACING_SM : SPACING * responsiveSizeMultiplier
                }
              ]}
            >
              {!!dAppData && (
                <DAppConnectHeader
                  title={t('Switch account request from')}
                  name={dAppData.name}
                  id={dAppData.id}
                  icon={dAppData.icon}
                  responsiveSizeMultiplier={responsiveSizeMultiplier}
                />
              )}
              <SwitchAccountBody
                account={account}
                nextAccount={nextAccount}
                nextAccountData={nextAccountData}
                nextRequestKind={nextRequestType}
                isRequestBroken={isRequestBroken}
                responsiveSizeMultiplier={responsiveSizeMultiplier}
              />
            </View>
          )}
        </View>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default SwitchAccountScreen
