import React, { useMemo } from 'react'
import { View } from 'react-native'

import { getCallsCount } from '@ambire-common/utils/userRequest'
import BatchIcon from '@common/assets/svg/BatchIcon'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import ActionsPagination from '@common/modules/action-requests/components/ActionsPagination'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { Props } from './Footer'
import RejectButton from './RejectButton'

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
  shouldRejectOnchain,
  isRejectDisabled,
  signButtonType = 'primary'
}: Props) => {
  const { t } = useTranslation()
  const { state: userRequests } = useController('RequestsController', 'userRequests')
  const { state: account } = useController('SelectedAccountController', 'account')
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

  const signature = accountOp?.signature
  const isMultisigSigned = useMemo(() => {
    // '0x' is a placeholder used by self-broadcast account ops, not a real signature.
    return !!signature && signature !== '0x'
  }, [signature])

  const batchBtnText = useMemo(() => {
    if (isMultisigSigned) return t('Sign later')
    return batchCount > 1
      ? t('Add to batch ({{batchCount}})', {
          batchCount
        })
      : t('Start a batch')
  }, [isMultisigSigned, batchCount, t])

  return (
    <View style={spacings.ptSm}>
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
            buttonType={
              signButtonType === 'dangerFilled'
                ? 'dangerFilled'
                : signButtonType === 'warning'
                  ? 'warning'
                  : 'primary'
            }
            disabled={isSignDisabled}
            onHoldComplete={onSign}
            testID="proceed-btn"
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
          />
        )}
      </View>

      <View style={[flexbox.directionRow, { columnGap: SPACING_SM }]}>
        <View style={flexbox.flex1}>
          <RejectButton
            onReject={onReject}
            isSignLoading={isSignLoading}
            shouldRejectOnchain={shouldRejectOnchain}
            isRejectDisabled={isRejectDisabled}
            style={{ height: 50 }}
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
      <ActionsPagination />
    </View>
  )
}

export default Footer
