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
import NetworkBadge from '@common/components/NetworkBadge'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import useSign from '@common/hooks/useSign'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import SmallNotificationWindowWrapper from '@web/components/SmallNotificationWindowWrapper'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'
import Estimation from '@web/modules/sign-account-op/components/Estimation'
import Footer from '@web/modules/sign-account-op/components/Footer'
import Modals from '@web/modules/sign-account-op/components/Modals/Modals'
import PendingTransactions from '@web/modules/sign-account-op/components/PendingTransactions'
import SafetyChecksOverlay from '@web/modules/sign-account-op/components/SafetyChecksOverlay'
import SectionHeading from '@web/modules/sign-account-op/components/SectionHeading'
import Simulation from '@web/modules/sign-account-op/components/Simulation'
import SigningKeySelect from '@web/modules/sign-message/components/SignKeySelect'

import getStyles from './styles'

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
  const paddingToBottom = 20
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
}

const SignAccountOpScreen = () => {
  const { currentUserRequest, visibleUserRequests } = useRequestsControllerState()
  const signAccountOpState = useSignAccountOpControllerState()
  const mainState = useMainControllerState()
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles, theme, themeType } = useTheme(getStyles)
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [hasReachedBottom, setHasReachedBottom] = useState<boolean | null>(null)

  const handleUpdateStatus = useCallback(
    (status: SigningStatus) => {
      dispatch({
        type: 'REQUESTS_CONTROLLER_CURRENT_SIGN_ACCOUNT_OP_UPDATE_STATUS',
        params: { status }
      })
    },
    [dispatch]
  )
  const updateController = useCallback(
    (params: { signingKeyAddr?: Key['addr']; signingKeyType?: Key['type'] }) => {
      dispatch({
        type: 'REQUESTS_CONTROLLER_CURRENT_SIGN_ACCOUNT_OP_UPDATE',
        params
      })
    },
    [dispatch]
  )

  const handleBroadcast = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_HANDLE_SIGN_AND_BROADCAST_ACCOUNT_OP',
      params: { type: 'default' }
    })
  }, [dispatch])
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
    shouldHoldToProceed
  } = useSign({
    handleUpdateStatus,
    signAccountOpState,
    handleUpdate: updateController,
    handleBroadcast
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

    const errorCode = signAccountOpState.errors[0].code

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
    const readyToSign = signAccountOpState?.readyToSign

    return isSignLoading || (!readyToSign && !isViewOnly)
  }, [isSignLoading, isViewOnly, signAccountOpState?.readyToSign])

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
        backgroundColor={theme.quinaryBackground}
        withHorizontalPadding={false}
        style={spacings.phMd}
        header={
          <HeaderAccountAndNetworkInfo
            backgroundColor={
              themeType === THEME_TYPES.DARK
                ? (theme.tertiaryBackground as string)
                : (theme.primaryBackground as string)
            }
          />
        }
        renderDirectChildren={() => (
          <View style={styles.footer}>
            {!estimationFailed ? (
              <>
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

                <View
                  style={{
                    height: 1,
                    backgroundColor:
                      themeType === THEME_TYPES.DARK ? theme.primaryBorder : theme.secondaryBorder,
                    ...spacings.mvLg
                  }}
                />
              </>
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
        )}
      >
        {signAccountOpState ? (
          <SigningKeySelect
            isVisible={isChooseSignerShown || isChooseFeePayerKeyShown}
            isSigning={isSignLoading || !signAccountOpState.readyToSign}
            handleClose={() => {
              setIsChooseSignerShown(false)
              setIsChooseFeePayerKeyShown(false)
            }}
            selectedAccountKeyStoreKeys={
              isChooseFeePayerKeyShown
                ? signAccountOpState.feePayerKeyStoreKeys
                : signAccountOpState.accountKeyStoreKeys
            }
            handleChooseKey={
              isChooseFeePayerKeyShown ? handleChangeFeePayerKeyType : handleChangeSigningKey
            }
            type={isChooseFeePayerKeyShown ? 'broadcasting' : 'signing'}
            account={signAccountOpState.account}
          />
        ) : null}
        <TabLayoutWrapperMainContent withScroll={false}>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.mbSm
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
            />
            {/* Display errors only if the user is not in view-only mode */}
            {signAccountOpState?.errors?.length && !isViewOnly ? (
              <AlertVertical
                type="warning"
                size="sm"
                title={signAccountOpState.errors[0].title}
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
