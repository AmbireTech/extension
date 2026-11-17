import { memo, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import { useTranslation } from '@common/config/localization'
import RejectRequestButton from '@common/modules/action-requests/components/RejectRequestButton'

import type { Props as ButtonProps } from '@common/components/Button'
import type { ViewStyle } from 'react-native'
type Props = {
  onReject: () => void
  isSignLoading: boolean
  shouldRejectOnchain: boolean
  isRejectDisabled: boolean
  size?: ButtonProps['size']
  style?: ButtonProps['style']
  containerStyle?: ViewStyle
}

const RejectButton = ({
  onReject,
  isSignLoading,
  shouldRejectOnchain,
  isRejectDisabled,
  size,
  style,
  containerStyle
}: Props) => {
  const { t } = useTranslation()
  const [isRejectOnchainLoading, setIsRejectOnchainLoading] = useState(false)

  const disabledTooltipDataSet = useMemo(
    () =>
      createGlobalTooltipDataSet({
        id: 'cancel-transaction-disabled-tooltip',
        content: t('The current transaction is already attempting a cancel'),
        hidden: !isRejectDisabled
      }),
    [isRejectDisabled, t]
  )

  const handleReject = useCallback(() => {
    if (shouldRejectOnchain) setIsRejectOnchainLoading(true)
    onReject()
  }, [onReject, shouldRejectOnchain])

  return (
    <View style={containerStyle} dataSet={disabledTooltipDataSet}>
      <RejectRequestButton
        testID="transaction-button-reject"
        text={
          shouldRejectOnchain
            ? isRejectOnchainLoading
              ? t('Canceling...')
              : t('Cancel')
            : t('Reject')
        }
        onReject={handleReject}
        // A Safe's onchain cancellation is a transaction of its own, not a refusal aimed at
        // the app, so it must never turn into the "shut this app up" choice.
        withOptions={!shouldRejectOnchain}
        optionsTitle={t('Cancel transaction')}
        rejectOptionText={t('Cancel this transaction')}
        hasBottomSpacing={false}
        size={size}
        disabled={isSignLoading || isRejectOnchainLoading || isRejectDisabled}
        style={style}
      />
    </View>
  )
}

export default memo(RejectButton)
