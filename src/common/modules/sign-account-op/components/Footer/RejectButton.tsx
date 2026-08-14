import React, { useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import Button, { Props as ButtonProps } from '@common/components/Button'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import { useTranslation } from '@common/config/localization'

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
      <Button
        testID="transaction-button-reject"
        type="danger"
        text={
          shouldRejectOnchain
            ? isRejectOnchainLoading
              ? t('Canceling...')
              : t('Cancel')
            : t('Reject')
        }
        onPress={handleReject}
        hasBottomSpacing={false}
        size={size}
        disabled={isSignLoading || isRejectOnchainLoading || isRejectDisabled}
        style={style}
      />
    </View>
  )
}

export default React.memo(RejectButton)
