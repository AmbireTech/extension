import React from 'react'
import { View } from 'react-native'

import HoldToProceedButton from '@common/components/HoldToProceedButton'
import useResponsiveActionWindow from '@common/hooks/useResponsiveActionWindow'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import DAppConnectAccountSettings from '@common/modules/action-requests/components/DAppConnect/DAppConnectAccountSettings'
import DAppConnectBody from '@common/modules/action-requests/components/DAppConnect/DAppConnectBody'
import DAppConnectHeader from '@common/modules/action-requests/components/DAppConnect/DAppConnectHeader'
import getStyles from '@common/modules/action-requests/components/DAppConnect/styles'
import useDappConnect from '@common/modules/action-requests/hooks/useDappConnect'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

// Screen for dApps authorization to connect to extension - will be triggered on dApp connect request
const DappConnectScreen = () => {
  const {
    t,
    dappToConnect,
    isAuthorizing,
    handleDenyButtonPress,
    handleAuthorizeButtonPress,
    shouldHoldToProceed,
    resolveButtonText
  } = useDappConnect()
  const { styles } = useTheme(getStyles)
  const { minHeightSize } = useWindowSize()
  const { responsiveSizeMultiplier } = useResponsiveActionWindow()

  return (
    <TabLayoutContainer
      width="full"
      header={<ActionHeader />}
      renderDirectChildren={() => (
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={!shouldHoldToProceed ? handleAuthorizeButtonPress : () => {}}
          resolveNode={
            shouldHoldToProceed ? (
              <HoldToProceedButton
                testID="dapp-connect-button"
                onHoldComplete={handleAuthorizeButtonPress}
                holdDuration={1600}
                style={{ height: 56 }}
                text={resolveButtonText}
                buttonType={
                  !!dappToConnect && dappToConnect.blacklisted === 'BLACKLISTED'
                    ? 'dangerFilled'
                    : 'warning'
                }
              />
            ) : undefined
          }
          resolveButtonText={!shouldHoldToProceed ? resolveButtonText : undefined}
          resolveDisabled={
            !shouldHoldToProceed
              ? isAuthorizing || (!!dappToConnect && dappToConnect.blacklisted === 'LOADING')
              : undefined
          }
          resolveType={!shouldHoldToProceed ? 'primary' : undefined}
          rejectButtonText={t('Deny')}
          resolveButtonTestID={!shouldHoldToProceed ? 'dapp-connect-button' : undefined}
        />
      )}
      style={{ marginTop: minHeightSize(650) ? 0 : SPACING * responsiveSizeMultiplier }}
    >
      {!!dappToConnect && (
        <TabLayoutWrapperMainContent
          contentContainerStyle={{ ...spacings.pb4Xl, ...spacings.mtMi }}
        >
          <View style={[styles.container]}>
            <View
              style={[
                styles.content,
                {
                  marginBottom: minHeightSize(650) ? SPACING_SM : SPACING * responsiveSizeMultiplier
                }
              ]}
            >
              <DAppConnectHeader
                name={dappToConnect.name}
                id={dappToConnect.id}
                icon={dappToConnect.icon!}
                securityCheck={dappToConnect.blacklisted}
                responsiveSizeMultiplier={responsiveSizeMultiplier}
              />
              <DAppConnectBody
                securityCheck={dappToConnect.blacklisted}
                responsiveSizeMultiplier={responsiveSizeMultiplier}
              />
            </View>
            <DAppConnectAccountSettings
              id={dappToConnect.id}
              accountPreferences={dappToConnect.accountPreferences}
            />
          </View>
        </TabLayoutWrapperMainContent>
      )}
    </TabLayoutContainer>
  )
}

export default DappConnectScreen
