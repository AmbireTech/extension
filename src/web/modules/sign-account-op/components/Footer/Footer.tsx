import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
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
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import ActionsPagination from '@web/modules/action-requests/components/ActionsPagination'

import getStyles from './styles'

type Props = {
  onReject: () => void
  onAddToCart: () => void
  onSign: () => void
  isSignLoading: boolean
  isSignDisabled: boolean
  isAddToCartDisplayed: boolean
  isAddToCartDisabled: boolean
  inProgressButtonText: string
  shouldHoldToProceed: boolean
  buttonText: string
  buttonTooltipText?: string
}

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
  const { accountOp, status } = useController('SignAccountOpController').state || {}
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

  // todo: make this compatible with the new design
  // if the txns has been queued, display only a success and close options
  if (status && status.type === SigningStatus.Queued) {
    return (
      <View style={styles.container}>
        <Button
          testID="transaction-button-reject"
          type="danger"
          text={t('Cancel')}
          onPress={() => {
            openModal()
          }}
          hasBottomSpacing={false}
          size="large"
          style={{ width: 98 }}
        />
        <ActionsPagination />
        <Button
          testID="close-queue-button"
          type="primary"
          text={t('Close')}
          onPress={onAddToCart}
          hasBottomSpacing={false}
          style={{ minWidth: 160, ...spacings.ph }}
          size="large"
        />
        <BottomSheet
          id="confirm-cancel"
          type="modal"
          sheetRef={sheetRef}
          backgroundColor={
            themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
          }
          closeBottomSheet={closeModal}
          onBackdropPress={closeModal}
        >
          <DualChoiceWarningModal
            title={t('Cancel transaction')}
            description={t(
              'You are about to cancel an already signed transcation. It will no longer be visible in Ambire.'
            )}
            primaryButtonText={t('Proceed')}
            secondaryButtonText={t('Return')}
            onPrimaryButtonPress={onReject}
            onSecondaryButtonPress={closeModal}
            type="error"
          />
        </BottomSheet>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[!isAddToCartDisplayed && flexbox.flex1, flexbox.alignStart]}>
        <Button
          testID="transaction-button-reject"
          type="danger"
          text={t('Reject')}
          onPress={onReject}
          hasBottomSpacing={false}
          size="large"
          disabled={isSignLoading}
          style={{ width: 98 }}
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
            style={{ minWidth: 160, ...spacings.ph, ...spacings.mrLg }}
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
          {shouldHoldToProceed ? (
            <HoldToProceedButton
              text={t('Hold to sign')}
              disabled={isSignDisabled}
              onHoldComplete={onSign}
              testID="proceed-btn"
              style={{ minWidth: 128 }}
              size="large"
            />
          ) : (
            <ButtonWithLoader
              testID="transaction-button-sign"
              type="primary"
              disabled={isSignDisabled}
              isLoading={isSignLoading}
              text={isSignLoading ? inProgressButtonText : buttonText}
              onPress={onSign}
              size="large"
              style={{ minWidth: 128 }}
            />
          )}
        </View>
      </View>
    </View>
  )
}

export default Footer
