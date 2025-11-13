import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Key } from '@ambire-common/interfaces/keystore'
import {
  ISignAccountOpController,
  SignAccountOpError
} from '@ambire-common/interfaces/signAccountOp'
import { SwapAndBridgeRoute } from '@ambire-common/interfaces/swapAndBridge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import NoKeysToSignAlert from '@common/components/NoKeysToSignAlert'
import Text from '@common/components/Text'
import useSign from '@common/hooks/useSign'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import Estimation from '@web/modules/sign-account-op/components/Estimation'
import Modals from '@web/modules/sign-account-op/components/Modals/Modals'
import SigningKeySelect from '@web/modules/sign-message/components/SignKeySelect'
import { getUiType } from '@web/utils/uiType'

import BundlerWarning from '../../Estimation/components/bundlerWarning'
import SafetyChecksBanner from '../../SafetyChecksBanner'

export type OneClickEstimationProps = {
  closeEstimationModal: () => void
  handleBroadcastAccountOp: () => void
  handleUpdateStatus: (status: SigningStatus) => void
  updateController: (params: { signingKeyAddr?: Key['addr']; signingKeyType?: Key['type'] }) => void
  estimationModalRef: React.RefObject<any>
  errors?: SignAccountOpError[]
  signAccountOpController: ISignAccountOpController | null
  hasProceeded: boolean
  updateType: 'Swap&Bridge' | 'Transfer&TopUp'
  serviceFee?: SwapAndBridgeRoute['serviceFee']
}

const { isActionWindow, isTab } = getUiType()

const OneClickEstimation = ({
  closeEstimationModal,
  handleBroadcastAccountOp,
  handleUpdateStatus,
  updateController,
  estimationModalRef,
  signAccountOpController,
  hasProceeded,
  errors,
  updateType,
  serviceFee
}: OneClickEstimationProps) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()

  const signingErrors = useMemo(() => {
    const signAccountOpErrors = signAccountOpController ? signAccountOpController.errors : []
    return [...(errors || []), ...signAccountOpErrors]
  }, [errors, signAccountOpController])

  const {
    isViewOnly,
    hasEstimation,
    signingKeyType,
    feePayerKeyType,
    handleDismissLedgerConnectModal,
    shouldDisplayLedgerConnectModal,
    isChooseSignerShown,
    setIsChooseSignerShown,
    isSignLoading,
    renderedButNotNecessarilyVisibleModal,
    handleChangeSigningKey,
    onSignButtonClick,
    isSignDisabled,
    warningToPromptBeforeSign,
    warningModalRef,
    dismissWarning,
    acknowledgeWarning,
    handleChangeFeePayerKeyType,
    isChooseFeePayerKeyShown,
    setIsChooseFeePayerKeyShown,
    slowPaymasterRequest,
    primaryButtonText,
    bundlerNonceDiscrepancy
  } = useSign({
    signAccountOpState: signAccountOpController,
    handleBroadcast: handleBroadcastAccountOp,
    handleUpdate: updateController,
    handleUpdateStatus,
    isOneClickSign: true,
    updateType
  })

  const { banners } = signAccountOpController || {}
  return (
    <>
      <BottomSheet
        id="estimation-modal"
        sheetRef={estimationModalRef}
        type={isTab ? 'modal' : 'bottom-sheet'}
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
        // NOTE: This must be lower than SigningKeySelect's z-index
        customZIndex={5}
        autoOpen={hasProceeded || (isActionWindow && !!signAccountOpController)}
        isScrollEnabled={false}
        shouldBeClosableOnDrag={false}
      >
        {!!banners && banners.length && (
          <View style={spacings.mbTy}>
            {banners.map((banner) => (
              <SafetyChecksBanner
                key={banner.id}
                type={banner.type}
                text={banner.text}
                style={spacings.mbTy}
              />
            ))}
          </View>
        )}
        {!!signAccountOpController && (
          <View>
            <SigningKeySelect
              isVisible={isChooseSignerShown || isChooseFeePayerKeyShown}
              isSigning={isSignLoading || !signAccountOpController.readyToSign}
              handleClose={() => {
                setIsChooseSignerShown(false)
                setIsChooseFeePayerKeyShown(false)
              }}
              selectedAccountKeyStoreKeys={
                isChooseFeePayerKeyShown
                  ? signAccountOpController.feePayerKeyStoreKeys
                  : signAccountOpController.accountKeyStoreKeys
              }
              handleChooseKey={
                isChooseFeePayerKeyShown ? handleChangeFeePayerKeyType : handleChangeSigningKey
              }
              type={isChooseFeePayerKeyShown ? 'broadcasting' : 'signing'}
              account={signAccountOpController.account}
            />
            <Estimation
              updateType={updateType}
              signAccountOpState={signAccountOpController}
              disabled={signAccountOpController.status?.type !== SigningStatus.ReadyToSign}
              hasEstimation={!!hasEstimation}
              // TODO<oneClickSwap>
              slowRequest={false}
              // TODO<oneClickSwap>
              isViewOnly={isViewOnly}
              isSponsored={signAccountOpController ? signAccountOpController.isSponsored : false}
              sponsor={signAccountOpController ? signAccountOpController.sponsor : undefined}
              serviceFee={serviceFee}
            />
            {signingErrors.length > 0 &&
              (signingErrors.map(({ code }) => code).includes('NO_KEYS_AVAILABLE') ? (
                <NoKeysToSignAlert style={spacings.mt} />
              ) : (
                <View style={[flexbox.directionRow, flexbox.alignEnd, spacings.mt]}>
                  <Text fontSize={12} appearance="errorText">
                    {t(signingErrors[0].title)}
                  </Text>
                </View>
              ))}
            <BundlerWarning
              signAccountOpState={signAccountOpController}
              bundlerNonceDiscrepancy={bundlerNonceDiscrepancy}
            />
            <View
              style={{
                height: 1,
                backgroundColor: theme.secondaryBorder,
                ...spacings.mvLg
              }}
            />
            <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
              <Button
                testID="back-button"
                type="secondary"
                text={t('Back')}
                onPress={closeEstimationModal}
                hasBottomSpacing={false}
                disabled={isSignLoading}
                style={{ width: 98 }}
              />
              <ButtonWithLoader
                testID="sign-button"
                text={primaryButtonText}
                isLoading={isSignLoading}
                disabled={isSignDisabled || signingErrors.length > 0}
                onPress={onSignButtonClick}
              />
            </View>
          </View>
        )}
      </BottomSheet>
      <Modals
        renderedButNotNecessarilyVisibleModal={renderedButNotNecessarilyVisibleModal}
        signAccountOpState={signAccountOpController}
        warningModalRef={warningModalRef}
        feePayerKeyType={feePayerKeyType}
        signingKeyType={signingKeyType}
        slowPaymasterRequest={slowPaymasterRequest}
        shouldDisplayLedgerConnectModal={shouldDisplayLedgerConnectModal}
        handleDismissLedgerConnectModal={handleDismissLedgerConnectModal}
        warningToPromptBeforeSign={warningToPromptBeforeSign}
        acknowledgeWarning={acknowledgeWarning}
        dismissWarning={dismissWarning}
        autoOpen={
          // Display the warning automatically if the user closed
          // the extension popup while the warning modal was open.
          warningToPromptBeforeSign &&
          renderedButNotNecessarilyVisibleModal === 'warnings' &&
          isSignLoading
            ? 'warnings'
            : undefined
        }
        actionType={updateType === 'Swap&Bridge' ? 'swapAndBridge' : 'transfer'}
      />
    </>
  )
}

export default OneClickEstimation
