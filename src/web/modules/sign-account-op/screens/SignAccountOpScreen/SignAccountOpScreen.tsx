import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Key } from '@ambire-common/interfaces/keystore'
import { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import { getErrorCodeStringFromReason } from '@ambire-common/libs/errorDecoder/helpers'
import CopyIcon from '@common/assets/svg/CopyIcon'
import Alert from '@common/components/Alert'
import AlertVertical from '@common/components/AlertVertical'
import GlassView from '@common/components/GlassView'
import NetworkBadge from '@common/components/NetworkBadge'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useSign from '@common/hooks/useSign'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import ActionHeader from '@web/modules/action-requests/components/ActionHeader'
import Estimation from '@web/modules/sign-account-op/components/Estimation'
import Footer from '@web/modules/sign-account-op/components/Footer'
import Modals from '@web/modules/sign-account-op/components/Modals/Modals'
import PendingTransactions from '@web/modules/sign-account-op/components/PendingTransactions'
import SafetyChecksOverlay from '@web/modules/sign-account-op/components/SafetyChecksOverlay'
import SectionHeading from '@web/modules/sign-account-op/components/SectionHeading'
import Simulation from '@web/modules/sign-account-op/components/Simulation'
import KeySelect from '@web/modules/sign-message/components/KeySelect'

import Gradient from './Gradient'
import getStyles from './styles'

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
  const paddingToBottom = 20
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
}

const SignAccountOpScreen = () => {
  const { currentUserRequest, visibleUserRequests } = useController('RequestsController').state
  const signAccountOpState = useController('SignAccountOpController').state
  const mainState = useController('MainController').state
  const { dispatch } = useControllersMiddleware()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles, theme, themeType } = useTheme(getStyles)
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [hasReachedBottom, setHasReachedBottom] = useState<boolean | null>(null)

  const handleUpdateStatus = useCallback(
    (status: SigningStatus) => {
      dispatch({
        type: 'CURRENT_SIGN_ACCOUNT_OP_UPDATE_STATUS',
        params: { updateType: 'Requests', status }
      })
    },
    [dispatch]
  )
  const updateController = useCallback(
    (params: { signingKeyAddr?: Key['addr']; signingKeyType?: Key['type'] }) => {
      dispatch({
        type: 'CURRENT_SIGN_ACCOUNT_OP_UPDATE',
        params: {
          updateType: 'Requests',
          ...params
        }
      })
    },
    [dispatch]
  )

  const {
    renderedButNotNecessarilyVisibleModal,
    isViewOnly,
    dismissWarning,
    acknowledgeWarning,
    isChooseSignerShown,
    setIsChooseSignerShown,
    onSignButtonClick,
    handleChangeSigningKey,
    warningToPromptBeforeSign,
    handleDismissLedgerConnectModal,
    slowPaymasterRequest,
    slowRequest,
    isSignLoading,
    hasEstimation,
    warningModalRef,
    handleChangeFeePayerKeyType,
    isChooseFeePayerKeyShown,
    setIsChooseFeePayerKeyShown,
    signingKeyType,
    feePayerKeyType,
    shouldDisplayLedgerConnectModal,
    network,
    isSignDisabled,
    bundlerNonceDiscrepancy,
    primaryButtonText,
    shouldHoldToProceed,
    handleSetMultisigSigners
  } = useSign({
    handleUpdateStatus,
    signAccountOpState,
    handleUpdate: updateController
  })

  const accountOpRequest = useMemo(() => {
    if (currentUserRequest?.kind !== 'calls') return undefined
    return currentUserRequest as CallsUserRequest
  }, [currentUserRequest])

  const handleRejectAccountOp = useCallback(() => {
    if (!accountOpRequest) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_REJECT_USER_REQUEST',
      params: {
        err: 'User rejected the transaction request.',
        id: accountOpRequest.id,
        options: {
          shouldOpenNextRequest: visibleUserRequests.length > 1
        }
      }
    })
  }, [dispatch, accountOpRequest, visibleUserRequests.length])

  const handleAddToCart = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    closeCurrentWindow()
  }, [])

  useEffect(() => {
    if (isSignDisabled || !containerHeight || !contentHeight) return
    const isScrollNotVisible = contentHeight <= containerHeight

    if (setHasReachedBottom && !hasReachedBottom) setHasReachedBottom(isScrollNotVisible)
  }, [
    contentHeight,
    containerHeight,
    setHasReachedBottom,
    hasReachedBottom,
    hasEstimation,
    isSignDisabled
  ])

  const copySignAccountOpError = useCallback(async () => {
    if (!signAccountOpState?.errors?.length) return

    const errorCode = signAccountOpState.errors[0]?.code

    if (!errorCode) return

    await setStringAsync(errorCode)
    addToast(t('Error code copied to clipboard'))
  }, [addToast, signAccountOpState?.errors, t])

  const errorText = useMemo(() => {
    const { code, text } = signAccountOpState?.errors?.[0] || {}

    if (code) {
      return (
        <AlertVertical.Text type="warning" size="sm" style={styles.alertText}>
          {getErrorCodeStringFromReason(code || '', false)}
          <Pressable
            // @ts-ignore web style
            style={{ verticalAlign: 'middle', ...spacings.mlMi, ...spacings.mbMi }}
            onPress={copySignAccountOpError}
          >
            <CopyIcon strokeWidth={1.5} width={20} height={20} color={theme.warningText} />
          </Pressable>
        </AlertVertical.Text>
      )
    }

    if (text) {
      return (
        <AlertVertical.Text type="warning" size="sm" style={styles.alertText}>
          {text}
        </AlertVertical.Text>
      )
    }

    return undefined
  }, [copySignAccountOpError, signAccountOpState?.errors, styles.alertText, theme.warningText])

  if (mainState.signAccOpInitError) {
    return (
      <View style={[StyleSheet.absoluteFill, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Alert type="error" title={mainState.signAccOpInitError} />
      </View>
    )
  }

  const isAddToCartDisabled = useMemo(() => {
    if (signAccountOpState?.account.safeCreation) return false
    const readyToSign = signAccountOpState?.readyToSign

    return isSignLoading || (!readyToSign && !isViewOnly)
  }, [
    isSignLoading,
    isViewOnly,
    signAccountOpState?.readyToSign,
    signAccountOpState?.account.safeCreation
  ])

  const estimationFailed = signAccountOpState?.status?.type === SigningStatus.EstimationError

  return (
    <SmallNotificationWindowWrapper>
      <SafetyChecksOverlay
        shouldBeVisible={
          !signAccountOpState?.isInitialized ||
          !signAccountOpState?.estimation.estimation ||
          !!signAccountOpState.safetyChecksLoading
        }
      />
      <Modals
        renderedButNotNecessarilyVisibleModal={renderedButNotNecessarilyVisibleModal}
        signAccountOpState={signAccountOpState}
        warningModalRef={warningModalRef}
        feePayerKeyType={feePayerKeyType}
        signingKeyType={signingKeyType}
        slowPaymasterRequest={slowPaymasterRequest}
        shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
        handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
        warningToPromptBeforeSign={warningToPromptBeforeSign}
        acknowledgeWarning={acknowledgeWarning}
        dismissWarning={dismissWarning}
      />
      <TabLayoutContainer
        width="full"
        backgroundColor={theme.primaryBackground}
        withHorizontalPadding={false}
        style={spacings.phMd}
        header={<ActionHeader />}
        renderDirectChildren={() => (
          <View style={[spacings.mh, spacings.mv]}>
            <GlassView
              tintColor2={hexToRgba('#D1D1D1', 0.12)}
              style={{ borderRadius: BORDER_RADIUS_PRIMARY }}
              cssStyle={{ borderRadius: BORDER_RADIUS_PRIMARY }}
            >
              {/* Gradient */}
              <Gradient
                style={{
                  position: 'absolute',
                  top: -70,
                  right: -70,
                  zIndex: -1
                }}
              />
              <View style={[spacings.ph, spacings.pv, flexbox.flex1]}>
                {!estimationFailed &&
                signAccountOpState?.canBroadcast &&
                signAccountOpState?.status?.type !== SigningStatus.Queued ? (
                  <View style={spacings.mbXl}>
                    <Estimation
                      signAccountOpState={signAccountOpState}
                      disabled={isSignLoading}
                      hasEstimation={!!hasEstimation}
                      slowRequest={slowRequest}
                      isViewOnly={isViewOnly}
                      isSponsored={signAccountOpState ? signAccountOpState.isSponsored : false}
                      sponsor={signAccountOpState ? signAccountOpState.sponsor : undefined}
                      updateType="Requests"
                      bundlerNonceDiscrepancy={bundlerNonceDiscrepancy}
                    />
                  </View>
                ) : null}

                <Footer
                  onReject={handleRejectAccountOp}
                  onAddToCart={handleAddToCart}
                  isAddToCartDisplayed={
                    !!signAccountOpState &&
                    !!network &&
                    signAccountOpState.accountOp.meta?.setDelegation === undefined
                  }
                  isSignLoading={isSignLoading}
                  isSignDisabled={isSignDisabled || !hasReachedBottom}
                  buttonTooltipText={
                    typeof hasReachedBottom === 'boolean' && !hasReachedBottom
                      ? t('Scroll to the bottom of the transaction overview to sign.')
                      : undefined
                  }
                  // Allow view only accounts or if no funds for gas to add to cart even if the txn is not ready to sign
                  // because they can't sign it anyway
                  isAddToCartDisabled={isAddToCartDisabled}
                  onSign={onSignButtonClick}
                  inProgressButtonText={
                    signAccountOpState?.status?.type === SigningStatus.WaitingForPaymaster
                      ? t('Sending...')
                      : t('Signing...')
                  }
                  buttonText={primaryButtonText}
                  shouldHoldToProceed={shouldHoldToProceed}
                />
              </View>
            </GlassView>
          </View>
        )}
      >
        {signAccountOpState && (
          <KeySelect
            isSigning={isSignLoading || !signAccountOpState.readyToSign}
            isChooseSignerShown={isChooseSignerShown}
            isChooseFeePayerKeyShown={isChooseFeePayerKeyShown}
            handleSetMultisigSigners={handleSetMultisigSigners}
            handleChooseKey={
              isChooseFeePayerKeyShown ? handleChangeFeePayerKeyType : handleChangeSigningKey
            }
            account={signAccountOpState.account}
            selectedAccountKeyStoreKeys={
              isChooseFeePayerKeyShown
                ? signAccountOpState.feePayerKeyStoreKeys
                : signAccountOpState.accountKeyStoreKeys
            }
            handleClose={() => {
              setIsChooseSignerShown(false)
              setIsChooseFeePayerKeyShown(false)
            }}
            signed={signAccountOpState.accountOp.signed || []}
            threshold={signAccountOpState.threshold}
          />
        )}
        <TabLayoutWrapperMainContent withScroll={false}>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.mb
            ]}
          >
            <SectionHeading withMb={false}>{t('Overview')}</SectionHeading>
            <NetworkBadge chainId={network?.chainId} withOnPrefix />
          </View>
          {/* TabLayoutWrapperMainContent supports scroll but the logic that determines the height
          of the content doesn't work with it, so we use a ScrollView here */}
          <ScrollView
            onScroll={(e) => {
              if (isCloseToBottom(e.nativeEvent) && setHasReachedBottom) setHasReachedBottom(true)
            }}
            onLayout={(e) => {
              setContainerHeight(e.nativeEvent.layout.height)
            }}
            onContentSizeChange={(_, height) => {
              setContentHeight(height)
            }}
            scrollEventThrottle={400}
            style={contentHeight > containerHeight ? spacings.prMi : {}}
          >
            <PendingTransactions
              network={network}
              setDelegation={signAccountOpState?.accountOp.meta?.setDelegation}
              delegatedContract={signAccountOpState?.delegatedContract}
              hideDeleteIcon={!!signAccountOpState?.accountOp.signed?.length}
            />
            {/* Display errors only if the user is not in view-only mode */}
            {signAccountOpState?.errors?.length && !isViewOnly ? (
              <AlertVertical
                type="warning"
                size="sm"
                title={signAccountOpState.errors[0]?.title}
                text={errorText}
              />
            ) : (
              <Simulation
                network={network}
                isViewOnly={isViewOnly}
                isEstimationComplete={!!signAccountOpState?.isInitialized && !!network}
              />
            )}
            {isViewOnly && <NoKeysToSignAlert />}
          </ScrollView>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </SmallNotificationWindowWrapper>
  )
}

export default React.memo(SignAccountOpScreen)
