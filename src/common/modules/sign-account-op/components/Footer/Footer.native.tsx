import React, { useMemo } from 'react'
import { View } from 'react-native'

import { getCallsCount } from '@ambire-common/utils/userRequest'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

import BatchButton, { COMPACT_SECONDARY_BUTTON_PADDING } from './BatchButton'
import CompactFooterButtons from './CompactFooterButtons'
import { Props } from './Footer'
import RejectButton from './RejectButton'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectUserRequests = (state: AllControllersMappingType['RequestsController']) =>
  state.userRequests
const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

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
  holdToProceedButtonText,
  shouldRejectOnchain,
  isRejectDisabled,
  holdToProceedButtonType = 'primary',
  signButtonType = 'primary',
  onClose
}: Props) => {
  const { t } = useTranslation()
  const { state: userRequests } = useController('RequestsController', selectUserRequests)
  const { state: account } = useController('SelectedAccountController', selectAccount)
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

  const signature = accountOp?.signature
  const isMultisigSigned = useMemo(() => {
    // '0x' is a placeholder used by self-broadcast account ops, not a real signature.
    return !!signature && signature !== '0x'
  }, [signature])

  if (onClose) {
    return (
      <Button
        testID="transaction-button-close"
        type="primary"
        text={t('Close')}
        onPress={onClose}
        hasBottomSpacing={false}
        size="regular"
        style={{ width: '100%' }}
      />
    )
  }

  return (
    <CompactFooterButtons
      isEvenSplit={!isAddToCartDisplayed}
      secondaryActions={
        <>
          <RejectButton
            onReject={onReject}
            isSignLoading={isSignLoading}
            shouldRejectOnchain={shouldRejectOnchain}
            isRejectDisabled={isRejectDisabled}
            size="regular"
            containerStyle={{ flexGrow: 1 }}
            style={{ paddingHorizontal: COMPACT_SECONDARY_BUTTON_PADDING }}
          />
          {isAddToCartDisplayed && (
            <BatchButton
              testID="queue-and-sign-later-button"
              badgeCount={batchCount > 1 ? batchCount : 0}
              isSignLater={isMultisigSigned}
              onPress={onAddToCart}
              disabled={isAddToCartDisabled}
            />
          )}
        </>
      }
      primaryAction={
        <View
          dataSet={createGlobalTooltipDataSet({
            id: 'sign-button-tooltip',
            hidden: !buttonTooltipText,
            content: buttonTooltipText
          })}
        >
          {shouldHoldToProceed && (
            <HoldToProceedButton
              text={holdToProceedButtonText}
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
              size="regular"
              style={{ width: '100%' }}
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
              size="regular"
              style={{ width: '100%' }}
            />
          )}
        </View>
      }
    />
  )
}

export default Footer
