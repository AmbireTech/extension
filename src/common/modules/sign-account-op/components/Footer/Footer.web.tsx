import React, { useMemo } from 'react'
import { TextStyle, View } from 'react-native'

import { getCallsCount } from '@ambire-common/utils/userRequest'
import BatchIcon from '@common/assets/svg/BatchIcon'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { Props } from './Footer'
import RejectButton from './RejectButton'
import getStyles from './styles'

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
  shouldRejectOnchain,
  isRejectDisabled,
  holdToProceedButtonType = 'primary',
  signButtonType = 'primary'
}: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { isCompactLayout } = useCompactActionRequestLayout()
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

  const compactBatchBtnText = useMemo(() => {
    if (isMultisigSigned) return t('Sign later')
    return batchCount > 1
      ? t('Batch ({{batchCount}})', {
          batchCount
        })
      : t('Start a batch')
  }, [isMultisigSigned, batchCount, t])

  const rejectButton = ({
    fullWidth,
    compact = false
  }: {
    fullWidth: boolean
    compact?: boolean
  }) => (
    <RejectButton
      onReject={onReject}
      isSignLoading={isSignLoading}
      shouldRejectOnchain={shouldRejectOnchain}
      isRejectDisabled={isRejectDisabled}
      size={compact ? 'smaller' : 'large'}
      containerStyle={fullWidth ? { width: '100%' } : undefined}
      style={
        fullWidth ? { width: '100%', minWidth: 0 } : { width: 98, height: FOOTER_BUTTON_HEIGHT }
      }
    />
  )

  const batchButton = ({
    fullWidth,
    compact = false
  }: {
    fullWidth: boolean
    compact?: boolean
  }) => (
    <Button
      testID="queue-and-sign-later-button"
      type="secondary"
      childrenPosition="left"
      text={compact ? compactBatchBtnText : batchBtnText}
      onPress={onAddToCart}
      disabled={isAddToCartDisabled}
      hasBottomSpacing={false}
      style={
        fullWidth
          ? { width: '100%', minWidth: 0 }
          : { minWidth: 160, height: FOOTER_BUTTON_HEIGHT, ...spacings.ph }
      }
      size={compact ? 'smaller' : 'large'}
      textStyle={
        compact && isWeb
          ? ({
              flexShrink: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            } as TextStyle)
          : undefined
      }
      {...(!isMultisigSigned &&
        !compact && {
          tooltipDataSet: createGlobalTooltipDataSet({
            id: 'start-batch-info-tooltip',
            content: startBatchingInfo
          })
        })}
    >
      {!isMultisigSigned && !compact && <BatchIcon style={spacings.mlTy} />}
    </Button>
  )

  const signButton = (fullWidth: boolean) => (
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
          style={fullWidth ? { width: '100%' } : [spacings.ml, { height: FOOTER_BUTTON_HEIGHT }]}
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
          style={
            fullWidth
              ? { width: '100%' }
              : [{ minWidth: 128, height: FOOTER_BUTTON_HEIGHT }, spacings.ml]
          }
        />
      )}
    </View>
  )

  if (isCompactLayout) {
    return (
      <View
        style={[
          styles.container,
          {
            flexDirection: 'column',
            alignItems: 'stretch',
            flexGrow: 0,
            flex: 0,
            justifyContent: 'flex-start',
            ...spacings.ptSm
          }
        ]}
      >
        <View style={{ width: '100%' }}>{signButton(true)}</View>
        {isAddToCartDisplayed ? (
          <View
            style={[
              flexbox.directionRow,
              { width: '100%', gap: SPACING_TY, marginTop: SPACING_SM }
            ]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              {rejectButton({ fullWidth: true, compact: true })}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {batchButton({ fullWidth: true, compact: true })}
            </View>
          </View>
        ) : (
          <View style={{ width: '100%', marginTop: SPACING_SM }}>
            {rejectButton({ fullWidth: true })}
          </View>
        )}
      </View>
    )
  }

  return (
    <>
      <View style={styles.container}>
        <View style={[!isAddToCartDisplayed && flexbox.flex1, flexbox.alignStart]}>
          {rejectButton({ fullWidth: false })}
        </View>
        <View
          style={[flexbox.directionRow, !isAddToCartDisplayed && flexbox.flex1, flexbox.justifyEnd]}
        >
          {isAddToCartDisplayed && batchButton({ fullWidth: false })}
          {signButton(false)}
        </View>
      </View>
    </>
  )
}

export default Footer
