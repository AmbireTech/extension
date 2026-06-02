import React from 'react'
import { View } from 'react-native'

import Spinner from '@common/components/Spinner'
import useResponsiveActionWindow from '@common/hooks/useResponsiveActionWindow'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import ActionHeader from '@common/modules/action-requests/components/ActionHeader'
import AddChain from '@common/modules/action-requests/components/AddOrUpdateChain/AddChain'
import AlreadyAddedChain from '@common/modules/action-requests/components/AddOrUpdateChain/AlreadyAddedChain'
import UpdateChain from '@common/modules/action-requests/components/AddOrUpdateChain/UpdateChain'
import useAddOrUpdateNetwork from '@common/modules/action-requests/hooks/useAddOrUpdateNetwork'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

/**
 * This screen is used to add a new network to the wallet. If the network is already in the wallet
 * but disabled, it will be enabled. The configuration usually comes from the dApp, but in the case
 * that it already exists, the dApp configuration is ignored.
 */
const AddOrUpdateNetworkScreen = () => {
  const {
    t,
    userRequest,
    statuses,
    features,
    existingNetwork,
    actionButtonPressedRef,
    successStateText,
    areParamsValid,
    networkAlreadyAdded,
    rpcUrls,
    rpcUrlIndex,
    networkDetails,
    handleDenyButtonPress,
    handleCloseOnAlreadyAdded,
    handleUpdateNetwork,
    handlePrimaryButtonPress,
    handleRetryWithDifferentRpcUrl,
    resolveButtonText,
    view
  } = useAddOrUpdateNetwork()
  const { responsiveSizeMultiplier } = useResponsiveActionWindow({ maxBreakpoints: 2 })

  if (view === 'loading') {
    return (
      <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Spinner />
      </View>
    )
  }

  if (view === 'update' && networkAlreadyAdded) {
    return (
      <TabLayoutContainer
        width="full"
        header={<ActionHeader />}
        renderDirectChildren={() => (
          <ActionFooter
            onReject={handleDenyButtonPress}
            onResolve={handleUpdateNetwork}
            resolveButtonText={t('Update network')}
            rejectButtonText={t('Reject')}
            resolveDisabled={
              !areParamsValid ||
              statuses.addNetwork === 'LOADING' ||
              statuses.updateNetwork === 'LOADING' ||
              (features &&
                (features.some((f) => f.level === 'loading') ||
                  !!features.find((f) => f.id === 'flagged'))) ||
              actionButtonPressedRef.current
            }
          />
        )}
      >
        <TabLayoutWrapperMainContent
          style={{
            marginBottom: SPACING_LG * responsiveSizeMultiplier
          }}
          withScroll={false}
        >
          <UpdateChain
            handleRetryWithDifferentRpcUrl={handleRetryWithDifferentRpcUrl}
            areParamsValid={areParamsValid}
            features={features}
            networkDetails={networkDetails}
            networkAlreadyAdded={networkAlreadyAdded}
            userRequest={userRequest}
            actionButtonPressedRef={actionButtonPressedRef}
            rpcUrls={rpcUrls}
            rpcUrlIndex={rpcUrlIndex}
          />
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    )
  }

  if (view === 'alreadyAdded' && networkAlreadyAdded) {
    return (
      <TabLayoutContainer
        width="full"
        header={<ActionHeader />}
        renderDirectChildren={() => (
          <ActionFooter
            onReject={undefined}
            onResolve={handleCloseOnAlreadyAdded}
            resolveButtonText={t('Close')}
            rejectButtonText={undefined}
            resolveDisabled={
              statuses.addNetwork === 'LOADING' || statuses.updateNetwork === 'LOADING'
            }
          />
        )}
      >
        <TabLayoutWrapperMainContent style={spacings.mbLg} withScroll={false}>
          <AlreadyAddedChain
            networkAlreadyAdded={networkAlreadyAdded}
            successStateText={successStateText}
          />
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    )
  }

  return (
    <TabLayoutContainer
      width="full"
      header={<ActionHeader />}
      renderDirectChildren={() => (
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handlePrimaryButtonPress}
          resolveButtonText={resolveButtonText}
          resolveDisabled={
            !areParamsValid ||
            statuses.addNetwork === 'LOADING' ||
            statuses.updateNetwork === 'LOADING' ||
            (features &&
              (features.some((f) => f.level === 'loading') ||
                !!features.filter((f) => f.id === 'flagged')[0])) ||
            actionButtonPressedRef.current
          }
        />
      )}
    >
      <TabLayoutWrapperMainContent
        style={{
          marginBottom: SPACING_LG * responsiveSizeMultiplier
        }}
        withScroll={false}
      >
        <AddChain
          handleRetryWithDifferentRpcUrl={handleRetryWithDifferentRpcUrl}
          areParamsValid={areParamsValid}
          features={features}
          networkDetails={networkDetails}
          actionButtonPressedRef={actionButtonPressedRef}
          rpcUrls={rpcUrls}
          rpcUrlIndex={rpcUrlIndex}
          existingNetwork={existingNetwork}
          userRequest={userRequest}
        />
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(AddOrUpdateNetworkScreen)
