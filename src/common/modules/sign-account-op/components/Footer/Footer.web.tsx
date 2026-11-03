import React, { useMemo } from 'react'
import { View } from 'react-native'

import { getCallsCount } from '@ambire-common/utils/userRequest'
import Button, { BUTTON_HEIGHT } from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import BatchButton, { COMPACT_SECONDARY_BUTTON_PADDING } from './BatchButton'
import CompactFooterButtons from './CompactFooterButtons'
import { Props } from './Footer'
import RejectButton from './RejectButton'
import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// Keep every button in the footer on this height, otherwise they won't line up
const FOOTER_BUTTON_HEIGHT = BUTTON_HEIGHT

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
  const { styles } = useTheme(getStyles)
  const { isCompactLayout } = useCompactLayout()
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

  const batchBadgeCount = batchCount > 1 ? batchCount : 0

  if (onClose) {
    return (
      <Button
        testID="transaction-button-close"
        type="primary"
        text={t('Close')}
        onPress={onClose}
        hasBottomSpacing={false}
        size={isCompactLayout ? 'regular' : 'large'}
        style={{ width: '100%', ...(!isCompactLayout && { height: FOOTER_BUTTON_HEIGHT }) }}
      />
    )
  }

  const rejectButton = (
    <RejectButton
      onReject={onReject}
      isSignLoading={isSignLoading}
      shouldRejectOnchain={shouldRejectOnchain}
      isRejectDisabled={isRejectDisabled}
      size="large"
      style={{ width: 98, height: FOOTER_BUTTON_HEIGHT }}
    />
  )

  const batchButton = (
    <BatchButton
      testID="queue-and-sign-later-button"
      size="large"
      badgeCount={batchBadgeCount}
      isSignLater={isMultisigSigned}
      infoTooltip={startBatchingInfo}
      onPress={onAddToCart}
      disabled={isAddToCartDisabled}
      style={{ minWidth: 160, height: FOOTER_BUTTON_HEIGHT, ...spacings.ph }}
    />
  )

  const signButton = (isCompact: boolean) => (
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
          style={isCompact ? { width: '100%' } : [spacings.ml, { height: FOOTER_BUTTON_HEIGHT }]}
          size={isCompact ? 'regular' : 'large'}
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
          size={isCompact ? 'regular' : 'large'}
          style={
            isCompact
              ? { width: '100%' }
              : [{ minWidth: 128, height: FOOTER_BUTTON_HEIGHT }, spacings.ml]
          }
        />
      )}
    </View>
  )

  if (isCompactLayout) {
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
                badgeCount={batchBadgeCount}
                isSignLater={isMultisigSigned}
                onPress={onAddToCart}
                disabled={isAddToCartDisabled}
              />
            )}
          </>
        }
        primaryAction={signButton(true)}
      />
    )
  }

  return (
    <>
      <View style={styles.container}>
        <View style={[!isAddToCartDisplayed && flexbox.flex1, flexbox.alignStart]}>
          {rejectButton}
        </View>
        <View
          style={[flexbox.directionRow, !isAddToCartDisplayed && flexbox.flex1, flexbox.justifyEnd]}
        >
          {isAddToCartDisplayed && batchButton}
          {signButton(false)}
        </View>
      </View>
    </>
  )
}

export default Footer
