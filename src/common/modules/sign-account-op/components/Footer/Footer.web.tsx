import React, { useCallback, useMemo } from 'react'
import { TextStyle, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getCallsCount } from '@ambire-common/utils/userRequest'
import BatchIcon from '@common/assets/svg/BatchIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import ActionsPagination from '@common/modules/action-requests/components/ActionsPagination'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

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
  shouldHoldToProceed,
  holdToProceedButtonType = 'primary',
  signButtonType = 'primary'
}: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { isSidePanel } = getUiType()
  const { userRequests } = useController('RequestsController').state
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { accountOp } = useController('SignAccountOpController').state || {}
  const chainId = accountOp?.chainId
  const isNarrowLayout = isSidePanel

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

  const { ref: sheetRef, open: openModal, close: closeModal } = useModalize()

  const handleRejectPress = useCallback(() => {
    if (isMultisigSigned) {
      openModal()
    } else {
      onReject()
    }
  }, [isMultisigSigned, onReject, openModal])

  const confirmRejectModal = (
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
  )

  const rejectButton = ({ fullWidth, compact = false }: { fullWidth: boolean; compact?: boolean }) => (
    <Button
      testID="transaction-button-reject"
      type="danger"
      text={t('Reject')}
      onPress={handleRejectPress}
      hasBottomSpacing={false}
      size={compact ? 'smaller' : 'large'}
      disabled={isSignLoading}
      style={fullWidth ? { width: '100%', minWidth: 0 } : { width: 98 }}
    />
  )

  const batchButton = ({ fullWidth, compact = false }: { fullWidth: boolean; compact?: boolean }) => (
    <Button
      testID="queue-and-sign-later-button"
      type="secondary"
      childrenPosition="left"
      text={compact ? compactBatchBtnText : batchBtnText}
      onPress={onAddToCart}
      disabled={isAddToCartDisabled}
      hasBottomSpacing={false}
      style={fullWidth ? { width: '100%', minWidth: 0 } : { minWidth: 160, ...spacings.ph }}
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
          style={fullWidth ? { width: '100%' } : [{ minWidth: 128 }, spacings.mlLg]}
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
          style={fullWidth ? { width: '100%' } : [{ minWidth: 128 }, spacings.mlLg]}
        />
      )}
    </View>
  )

  if (isNarrowLayout) {
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
        <View style={{ width: '100%' }}>
          {signButton(true)}
          {confirmRejectModal}
        </View>
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
        <ActionsPagination />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[!isAddToCartDisplayed && flexbox.flex1, flexbox.alignStart]}>
        {rejectButton({ fullWidth: false })}
        {confirmRejectModal}
      </View>
      <ActionsPagination />
      <View
        style={[flexbox.directionRow, !isAddToCartDisplayed && flexbox.flex1, flexbox.justifyEnd]}
      >
        {isAddToCartDisplayed && batchButton({ fullWidth: false })}
        {signButton(false)}
      </View>
    </View>
  )
}

export default Footer
