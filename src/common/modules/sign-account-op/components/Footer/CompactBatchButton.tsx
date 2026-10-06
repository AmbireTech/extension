import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import BatchIcon from '@common/assets/svg/BatchIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

/** Narrower than the default button padding, so Reject and Batch fit next to each other */
export const COMPACT_SECONDARY_BUTTON_PADDING = 10

type Props = {
  /** Calls already in the batch for this account and network, the current one included */
  batchCount: number
  /** A signed Safe transaction can only be postponed, there is nothing to batch it with */
  isSignLater: boolean
  onPress: () => void
  disabled: boolean
}

/**
 * The batch button of the compact footer. The label stays short and the number of calls
 * already in the batch is a badge on the icon, so it fits next to Reject
 */
const CompactBatchButton = ({ batchCount, isSignLater, onPress, disabled }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const hasPendingBatch = batchCount > 1

  return (
    <Button
      testID="queue-and-sign-later-button"
      type="secondary"
      size="smaller"
      text={isSignLater ? t('Sign later') : t('Batch')}
      accessibilityLabel={
        hasPendingBatch && !isSignLater
          ? t('Add to batch ({{batchCount}})', { batchCount })
          : undefined
      }
      onPress={onPress}
      disabled={disabled}
      hasBottomSpacing={false}
      childrenPosition="left"
      style={{ flexGrow: 1, paddingHorizontal: COMPACT_SECONDARY_BUTTON_PADDING }}
    >
      {!isSignLater && (
        <View style={{ marginRight: hasPendingBatch ? 12 : 10 }}>
          <BatchIcon width={20} height={20} color={theme.primary} />
          {hasPendingBatch && (
            <View
              style={[
                flexbox.alignCenter,
                flexbox.justifyCenter,
                {
                  position: 'absolute',
                  top: -7,
                  right: -9,
                  minWidth: 16,
                  height: 16,
                  paddingHorizontal: 4,
                  borderRadius: 8,
                  backgroundColor: theme.primary
                }
              ]}
            >
              <Text fontSize={10} weight="semiBold" color={theme.primaryBackground}>
                {batchCount}
              </Text>
            </View>
          )}
        </View>
      )}
    </Button>
  )
}

export default React.memo(CompactBatchButton)
