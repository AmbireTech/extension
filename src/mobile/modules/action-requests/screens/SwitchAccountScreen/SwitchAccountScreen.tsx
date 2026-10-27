import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import useTheme from '@common/hooks/useTheme'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import DAppConnectHeader from '@common/modules/action-requests/components/DAppConnect/DAppConnectHeader'
import getStyles from '@common/modules/action-requests/components/DAppConnect/styles'
import SwitchAccountBody from '@common/modules/action-requests/components/SwitchAccount/SwitchAccountBody'
import useSwitchAccount from '@common/modules/action-requests/hooks/useSwitchAccount'
import spacings from '@common/styles/spacings'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const SwitchAccountScreen = () => {
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
    handleAuthorizeButtonPress
  } = useSwitchAccount()
  const { styles } = useTheme(getStyles)

  return (
    <MobileLayoutContainer
      withHorizontalPadding
      header={<ActionHeader />}
      footerStyle={{ ...spacings.ph0, ...spacings.pt0 }}
      footer={
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handleAuthorizeButtonPress}
          resolveButtonText={isAuthorizing ? t('Switching...') : t('Switch Account')}
          resolveButtonShortText={isAuthorizing ? undefined : t('Switch')}
          resolveDisabled={isAuthorizing || isRequestBroken}
          rejectButtonText={t('Deny')}
          resolveButtonTestID="switch-account-button"
        />
      }
    >
      {/* Scrolls on short screens, so the whole body can be seen */}
      <MobileLayoutWrapperMainContent withScroll withHorizontalPadding={false}>
        {isAuthorizing ? (
          <SkeletonLoader width="100%" height={450} appearance="primaryBackground" />
        ) : (
          <View style={styles.content}>
            {!!dAppData && (
              <DAppConnectHeader
                title={t('Switch account request from')}
                name={dAppData.name}
                id={dAppData.id}
                icon={dAppData.icon}
              />
            )}
            <SwitchAccountBody
              account={account}
              nextAccount={nextAccount}
              nextAccountData={nextAccountData}
              nextRequestKind={nextRequestType}
              isRequestBroken={isRequestBroken}
            />
          </View>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default SwitchAccountScreen
