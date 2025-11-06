import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SignAccountOpError } from '@ambire-common/interfaces/signAccountOp'
import { UserRequest } from '@ambire-common/interfaces/userRequest'
import { getCallsCount } from '@ambire-common/utils/userRequest'
import BatchIcon from '@common/assets/svg/BatchIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import { getUiType } from '@web/utils/uiType'

type Props = {
  handleSubmitForm: (isOneClickMode: boolean) => void
  proceedBtnText?: string
  signAccountOpErrors: SignAccountOpError[]
  isNotReadyToProceed: boolean
  isBridge?: boolean
  isLoading?: boolean
  isLocalStateOutOfSync?: boolean
  isBatchDisabled?: boolean
  networkUserRequests: UserRequest[]
  isRecipientAddressUnknown?: boolean
  isRecipientAddressUnknownAgreed?: boolean
  recipientAddress?: string
  onRecipientAddressUnknownAgree?: () => void
}

const { isActionWindow } = getUiType()

const Buttons: FC<Props> = ({
  signAccountOpErrors,
  proceedBtnText = 'Proceed',
  handleSubmitForm,
  isNotReadyToProceed,
  isLoading,
  isBatchDisabled,
  isBridge,
  networkUserRequests = [],
  isRecipientAddressUnknown = false,
  isRecipientAddressUnknownAgreed = false,
  onRecipientAddressUnknownAgree,
  // Used to disable the actions of the buttons when the local state is out of sync.
  // To prevent button flickering when the user is typing we just do nothing when the button is clicked.
  // As it would be a rare case for a user to manage to click it in the 300-400ms that it takes to sync the state,
  // but we still want to guard against it.
  isLocalStateOutOfSync
}) => {
  const { t } = useTranslation()
  const callsCount = getCallsCount(networkUserRequests)
  const { theme } = useTheme()

  const oneClickDisabledReason = useMemo(() => {
    if (signAccountOpErrors.length > 0) {
      return signAccountOpErrors[0].title
    }

    if (callsCount && isBridge) {
      return t('Cannot proceed with the bridge while other transactions are waiting for signing.')
    }

    return ''
  }, [signAccountOpErrors, isBridge, callsCount, t])

  const batchDisabledReason = useMemo(() => {
    if (isBridge) return t('Batching is not available for bridges.')

    return ''
  }, [isBridge, t])

  const startBatchingDisabled = useMemo(
    () => isNotReadyToProceed || isBatchDisabled || !!batchDisabledReason,
    [isNotReadyToProceed, isBatchDisabled, batchDisabledReason]
  )

  const startBatchingInfo = useMemo(
    () =>
      t(
        'Start a batch and sign later. This feature allows you to add more actions to this transaction and sign them all together later.'
      ),
    [t]
  )

  const primaryButtonText = useMemo(() => {
    if (proceedBtnText !== 'Proceed') {
      return proceedBtnText
    }

    return callsCount > 0
      ? `${proceedBtnText} ${t('({{count}})', {
          count: callsCount
        })}`
      : proceedBtnText
  }, [proceedBtnText, callsCount, t])

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: 'transparent',
      to: theme.quaternaryBackground
    }
  })

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd]}>
      {!isActionWindow && (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Button
            data-tooltip-id="batch-btn-tooltip"
            hasBottomSpacing={false}
            text={
              callsCount > 0 && !batchDisabledReason
                ? t('Add to batch ({{count}})', {
                    count: callsCount
                  })
                : t('Start a batch')
            }
            disabled={startBatchingDisabled}
            type="secondary"
            style={{ minWidth: 160, ...spacings.phMd }}
            onPress={() => {
              if (isLocalStateOutOfSync) return

              handleSubmitForm(false)
            }}
            testID="batch-btn"
          >
            <BatchIcon style={spacings.mlTy} />
          </Button>
          {/* @ts-ignore */}
          <View style={spacings.mlTy} dataSet={{ tooltipId: 'start-batch-info-tooltip' }}>
            <AnimatedPressable
              style={[spacings.phTy, spacings.pvTy, { borderRadius: 50 }, animStyle]}
              {...bindAnim}
            >
              <InfoIcon color={theme.tertiaryText} width={20} height={20} />
            </AnimatedPressable>
          </View>
        </View>
      )}
      {/* @ts-ignore */}
      <View dataSet={{ tooltipId: 'proceed-btn-tooltip' }}>
        {/* Show HoldToProceedButton when recipient address is unknown and user hasn't agreed yet */}
        {isRecipientAddressUnknown && !isRecipientAddressUnknownAgreed ? (
          <HoldToProceedButton
            text="Hold to proceed"
            disabled={isNotReadyToProceed || isLoading || !!oneClickDisabledReason}
            onHoldComplete={() => {
              if (isLocalStateOutOfSync) return
              onRecipientAddressUnknownAgree?.()

              handleSubmitForm(true)
            }}
            testID="proceed-btn"
          />
        ) : (
          <ButtonWithLoader
            text={primaryButtonText}
            disabled={isNotReadyToProceed || isLoading || !!oneClickDisabledReason}
            isLoading={isLoading}
            onPress={() => {
              if (isLocalStateOutOfSync) return

              handleSubmitForm(true)
            }}
            testID="proceed-btn"
          />
        )}
      </View>
      <Tooltip content={oneClickDisabledReason} id="proceed-btn-tooltip" />
      <Tooltip content={batchDisabledReason} id="batch-btn-tooltip" />
      <Tooltip content={startBatchingInfo} id="start-batch-info-tooltip" />
    </View>
  )
}

export default Buttons
