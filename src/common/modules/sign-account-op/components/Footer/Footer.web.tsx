import React, { useMemo } from 'react'
import { View } from 'react-native'

import { getCallsCount } from '@ambire-common/utils/userRequest'
import BatchIcon from '@common/assets/svg/BatchIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import ActionsPagination from '@common/modules/action-requests/components/ActionsPagination'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { Props } from './Footer'
import getStyles from './styles'
import useRejectConfirmation from './useRejectConfirmation'

// An exception to the `size="large"` height (56). The sign screen is dense and the
// footer is always visible, so all of its buttons are slightly shorter in order to
// free up vertical space for the transaction details above. Keep every button in
// the footer on this height, otherwise they won't line up.
const FOOTER_BUTTON_HEIGHT = 52

const Footer = ({
  onReject,
  onAddToCart,
  onSign,
  isSignLoading,
  isSignDisabled,
  buttonTooltipText,
  isAddToCartDisplayed,
  isAddToCartDisabled,
  inProgressButtonText,
  buttonText,
  shouldHoldToProceed,
  holdToProceedButtonType = 'primary',
  signButtonType = 'primary'
}: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { userRequests } = useController('RequestsController').state
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { accountOp } = useController('SignAccountOpController').state || {}
  const chainId = accountOp?.chainId

  const batchCount = useMemo(() => {
    const requests = userRequests.filter((r) => {
      return (
        r.kind === 'calls' && r.meta.accountAddr === account?.addr && r.meta.chainId === chainId
      )
    })

    return getCallsCount(requests)
  }, [account?.addr, userRequests, chainId])

  const startBatchingInfo = useMemo(
    () =>
      t(
        'Start a batch and sign later. This feature allows you to add more actions to this transaction and sign them all together later.'
      ),
    [t]
  )

  const isMultisigSigned = useMemo(() => {
    return !!account?.safeCreation && !!accountOp?.signature && accountOp?.signature !== '0x'
  }, [accountOp?.signature, account?.safeCreation])

  const batchBtnText = useMemo(() => {
    if (isMultisigSigned) return t('Sign later')
    return batchCount > 1
      ? t('Add to batch ({{batchCount}})', {
          batchCount
        })
      : t('Start a batch')
  }, [isMultisigSigned, batchCount, t])

  const { sheetRef, closeModal, handleReject, handleConfirmedReject } = useRejectConfirmation({
    isMultisigSigned,
    onReject
  })

  return (
    <View style={styles.container}>
      <View style={[!isAddToCartDisplayed && flexbox.flex1, flexbox.alignStart]}>
        <Button
          testID="transaction-button-reject"
          type="danger"
          text={t('Reject')}
          onPress={handleReject}
          hasBottomSpacing={false}
          size="large"
          disabled={isSignLoading}
          style={{ width: 100, height: FOOTER_BUTTON_HEIGHT }}
        />
      </View>
      <ActionsPagination />
      <View
        style={[flexbox.directionRow, !isAddToCartDisplayed && flexbox.flex1, flexbox.justifyEnd]}
      >
        {isAddToCartDisplayed && (
          <Button
            testID="queue-and-sign-later-button"
            type="secondary"
            childrenPosition="left"
            text={batchBtnText}
            onPress={onAddToCart}
            disabled={isAddToCartDisabled}
            hasBottomSpacing={false}
            style={{ minWidth: 160, height: FOOTER_BUTTON_HEIGHT, ...spacings.ph }}
            size="large"
            {...(!isMultisigSigned && {
              tooltipDataSet: createGlobalTooltipDataSet({
                id: 'start-batch-info-tooltip',
                content: startBatchingInfo
              })
            })}
          >
            {!isMultisigSigned && <BatchIcon style={spacings.mlTy} />}
          </Button>
        )}
        <View
          dataSet={createGlobalTooltipDataSet({
            id: 'sign-button-tooltip',
            hidden: !buttonTooltipText,
            content: buttonTooltipText
          })}
        >
          {shouldHoldToProceed && (
            <HoldToProceedButton
              text={t('Hold to sign')}
              buttonType={
                signButtonType === 'dangerFilled'
                  ? 'dangerFilled'
                  : signButtonType === 'warning'
                    ? 'warning'
                    : holdToProceedButtonType
              }
              disabled={isSignDisabled}
              onHoldComplete={onSign}
              testID="proceed-btn"
              style={[spacings.mlLg, { height: FOOTER_BUTTON_HEIGHT }]}
              size="large"
            />
          )}
          {!shouldHoldToProceed && (
            <ButtonWithLoader
              testID="transaction-button-sign"
              type={signButtonType}
              disabled={isSignDisabled}
              isLoading={isSignLoading}
              text={isSignLoading ? inProgressButtonText : buttonText}
              onPress={onSign}
              size="large"
              style={[{ minWidth: 100, height: FOOTER_BUTTON_HEIGHT }, spacings.ml]}
            />
          )}
          <BottomSheet
            id="confirm-hide"
            type="modal"
            sheetRef={sheetRef}
            closeBottomSheet={closeModal}
            onBackdropPress={closeModal}
          >
            <DualChoiceWarningModal
              title={t('Are you sure?')}
              description={t(
                'You are about to reject an already signed transaction. It will no longer be visible in Ambire.'
              )}
              primaryButtonText={t('Proceed')}
              secondaryButtonText={t('Return')}
              onPrimaryButtonPress={handleConfirmedReject}
              onSecondaryButtonPress={closeModal}
              type="error"
            />
          </BottomSheet>
        </View>
      </View>
    </View>
  )
}

export default Footer
