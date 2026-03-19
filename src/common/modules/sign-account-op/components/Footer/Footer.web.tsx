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
import spacings from '@common/styles/spacings'
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
    <View style={styles.container}>
      <View style={[!isAddToCartDisplayed && flexbox.flex1, flexbox.alignStart]}>
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
            style={{ minWidth: 160, ...spacings.ph }}
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
              disabled={isSignDisabled}
              onHoldComplete={onSign}
              testID="proceed-btn"
              style={[{ minWidth: 128 }, spacings.mlLg]}
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
              style={[{ minWidth: 128 }, spacings.mlLg]}
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
      </View>
    </View>
  )
}

export default Footer
