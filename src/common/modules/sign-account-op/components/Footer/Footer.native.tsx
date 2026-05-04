import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

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
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { Props } from './Footer'
import getStyles from './styles'

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
  shouldHoldToProceed
}: Props) => {
  const { t } = useTranslation()
  const { styles, themeType } = useTheme(getStyles)
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
    return !!accountOp?.signature
  }, [accountOp?.signature])

  const batchBtnText = useMemo(() => {
    if (isMultisigSigned) return t('Sign later')
    return batchCount > 1
      ? t('Add to batch ({{batchCount}})', {
          batchCount
        })
      : t('Start a batch')
  }, [isMultisigSigned, batchCount, t])

  const { ref: sheetRef, open: openModal, close: closeModal } = useModalize()

  return (
    <View style={spacings.pt}>
      <View
        dataSet={createGlobalTooltipDataSet({
          id: 'sign-button-tooltip',
          hidden: !buttonTooltipText,
          content: buttonTooltipText
        })}
        style={spacings.mbSm}
      >
        {shouldHoldToProceed && (
          <HoldToProceedButton
            text={t('Hold to sign')}
            disabled={isSignDisabled}
            onHoldComplete={onSign}
            testID="proceed-btn"
            size="large"
          />
        )}
        {!shouldHoldToProceed && (
          <ButtonWithLoader
            testID="transaction-button-sign"
            type="primary"
            disabled={isSignDisabled}
            isLoading={isSignLoading}
            text={isSignLoading ? inProgressButtonText : buttonText}
            onPress={onSign}
            size="large"
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
              'You are about to reject an already signed transcation. It will no longer be visible in Ambire.'
            )}
            primaryButtonText={t('Proceed')}
            secondaryButtonText={t('Return')}
            onPrimaryButtonPress={onReject}
            onSecondaryButtonPress={closeModal}
            type="error"
          />
        </BottomSheet>
      </View>

      <View style={[flexbox.directionRow, { columnGap: SPACING_SM }]}>
        <View style={flexbox.flex1}>
          <Button
            testID="transaction-button-reject"
            type="danger"
            text={t('Reject')}
            onPress={() => {
              if (isMultisigSigned) {
                openModal()
              } else {
                onReject()
              }
            }}
            style={{ height: 50 }}
            hasBottomSpacing={false}
            disabled={isSignLoading}
          />
        </View>
        {isAddToCartDisplayed && (
          <View style={flexbox.flex1}>
            <Button
              testID="queue-and-sign-later-button"
              type="secondary"
              childrenPosition="left"
              text={batchBtnText}
              onPress={onAddToCart}
              disabled={isAddToCartDisabled}
              style={{ height: 50 }}
              hasBottomSpacing={false}
              {...(!isMultisigSigned && {
                tooltipDataSet: createGlobalTooltipDataSet({
                  id: 'start-batch-info-tooltip',
                  content: startBatchingInfo
                })
              })}
            >
              {!isMultisigSigned && <BatchIcon style={spacings.mrTy} />}
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

export default Footer
