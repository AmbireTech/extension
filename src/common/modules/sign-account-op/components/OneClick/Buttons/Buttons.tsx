import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SignAccountOpError } from '@ambire-common/interfaces/signAccountOp'
import { UserRequest } from '@ambire-common/interfaces/userRequest'
import { getCallsCount } from '@ambire-common/utils/userRequest'
import BatchIcon from '@common/assets/svg/BatchIcon'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { isMobile, isWeb } from '@common/config/env'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

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
  shouldHoldToProceed?: boolean
  onRecipientAddressUnknownAgree?: () => void
}

const { isRequestWindow } = getUiType()

const Buttons: FC<Props> = ({
  signAccountOpErrors,
  proceedBtnText = 'Proceed',
  handleSubmitForm,
  isNotReadyToProceed,
  isLoading,
  isBatchDisabled,
  isBridge,
  networkUserRequests = [],
  shouldHoldToProceed,
  onRecipientAddressUnknownAgree,
  // Used to disable the actions of the buttons when the local state is out of sync.
  // To prevent button flickering when the user is typing we just do nothing when the button is clicked.
  // As it would be a rare case for a user to manage to click it in the 300-400ms that it takes to sync the state,
  // but we still want to guard against it.
  isLocalStateOutOfSync
}) => {
  const { t } = useTranslation()
  const callsCount = getCallsCount(networkUserRequests)

  const oneClickDisabledReason = useMemo(() => {
    if (signAccountOpErrors.length > 0) {
      return signAccountOpErrors[0]?.title
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

  return (
    <View
      style={[
        isWeb ? flexbox.directionRow : { flexDirection: 'column-reverse' },
        isWeb && flexbox.alignCenter,
        isMobile && spacings.ptSm,
        flexbox.justifyEnd
      ]}
    >
      {!isRequestWindow && (
        <View
          dataSet={createGlobalTooltipDataSet({
            id: 'batch-btn-tooltip',
            content: batchDisabledReason
          })}
          style={isWeb && spacings.mrLg}
        >
          <Button
            hasBottomSpacing={false}
            text={
              callsCount > 0 && !batchDisabledReason
                ? t('Add to batch ({{count}})', {
                    count: callsCount
                  })
                : t('Start a batch')
            }
            size={isWeb ? 'smaller' : 'regular'}
            disabled={startBatchingDisabled}
            type="secondary"
            tooltipDataSet={createGlobalTooltipDataSet({
              id: 'start-batch-info-tooltip',
              content: startBatchingInfo
            })}
            childrenPosition="left"
            style={isWeb ? { minWidth: 160, ...spacings.phMd } : {}}
            onPress={() => {
              if (isLocalStateOutOfSync) return
              handleSubmitForm(false)
            }}
            testID="batch-btn"
          >
            <BatchIcon style={spacings.mrMi} />
          </Button>
        </View>
      )}
      <View
        dataSet={createGlobalTooltipDataSet({
          id: 'proceed-btn-tooltip',
          content: oneClickDisabledReason
        })}
        style={isMobile && spacings.mbSm}
      >
        {shouldHoldToProceed ? (
          <HoldToProceedButton
            text={t('Hold to proceed')}
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
            size={isWeb ? 'smaller' : 'regular'}
            testID="proceed-btn"
          />
        )}
      </View>
    </View>
  )
}

export default Buttons
