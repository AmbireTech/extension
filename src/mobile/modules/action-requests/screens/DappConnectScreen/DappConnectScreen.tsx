/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react'
import { View } from 'react-native'

import HoldToProceedButton from '@common/components/HoldToProceedButton'
import useTheme from '@common/hooks/useTheme'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import DAppConnectBody from '@common/modules/action-requests/components/DAppConnect/DAppConnectBody'
import DAppConnectHeader from '@common/modules/action-requests/components/DAppConnect/DAppConnectHeader'
import getStyles from '@common/modules/action-requests/components/DAppConnect/styles'
import useDappConnect from '@common/modules/action-requests/hooks/useDappConnect'
import spacings from '@common/styles/spacings'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

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

  return (
    <MobileLayoutContainer
      footerStyle={{ ...spacings.ph0, ...spacings.pt0 }}
      footer={
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
                buttonType={((): 'dangerFilled' | 'warning' => {
                  if (!!dappToConnect && dappToConnect.blacklisted === 'BLACKLISTED')
                    return 'dangerFilled'
                  return 'warning'
                })()}
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
      }
    >
      {!!dappToConnect && (
        <View style={styles.content}>
          <DAppConnectHeader
            name={dappToConnect.name}
            id={dappToConnect.id}
            icon={dappToConnect.icon!}
            securityCheck={dappToConnect.blacklisted}
          />
          <DAppConnectBody securityCheck={dappToConnect.blacklisted} />
        </View>
      )}
    </MobileLayoutContainer>
  )
}

export default DappConnectScreen
