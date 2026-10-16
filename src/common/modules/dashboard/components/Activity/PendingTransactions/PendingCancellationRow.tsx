import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import type { FC } from 'react'

interface Props {
  /** The pending cancellation of the nonce, if one was already prepared. It replaces every
   * transaction on that nonce, so it is displayed once for the whole nonce, instead of as a
   * transaction of its own. */
  cancellationRequest: CallsUserRequest | undefined
  /** The transaction of the nonce a cancellation gets prepared from, when none exists yet. */
  transactionRequest: CallsUserRequest | undefined
  /** Whether more than one transaction is pending on the nonce. The label then says that
   * the cancellation covers all of them. */
  hasMultipleTransactions: boolean
  /** Called when the button gets (or stops being) hovered, so that the transactions it
   * cancels can be highlighted. */
  onHoverChange: (isHovered: boolean) => void
}

/**
 * A row, shown under the transactions of the nonce, with the signatures collected for the
 * cancellation of the nonce so far and a Cancel button. It is always displayed. When a
 * cancellation exists, the button opens it in the sign flow. Otherwise, the button prepares
 * one, exactly as the Cancel button on the sign screen does.
 */
// Resets the button if the sign flow never opens, so it can't stay stuck on "Cancelling..."
const CANCELLING_RESET_TIMEOUT_MS = 5000

const PendingCancellationRow: FC<Props> = ({
  cancellationRequest,
  transactionRequest,
  hasMultipleTransactions,
  onHoverChange
}) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const [isCancelling, setIsCancelling] = useState(false)
  const request = cancellationRequest || transactionRequest
  const signed = cancellationRequest?.signAccountOp.accountOp.signed
  const threshold = request?.signAccountOp.threshold ?? 0

  // The same owner can be listed more than once, so the addresses are counted as a set
  const signedCount = useMemo(
    () => new Set((signed || []).map((addr) => addr.toLowerCase())).size,
    [signed]
  )

  useEffect(() => {
    if (!isCancelling) return

    const timeout = setTimeout(() => setIsCancelling(false), CANCELLING_RESET_TIMEOUT_MS)

    return () => clearTimeout(timeout)
  }, [isCancelling])

  const handlePress = useCallback(() => {
    if (!request) return

    // There is a short pause before the sign flow opens, so give instant feedback
    setIsCancelling(true)

    if (cancellationRequest) {
      requestsDispatch({
        type: 'method',
        params: { method: 'setCurrentUserRequestById', args: [cancellationRequest.id] }
      })
      return
    }

    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [{ type: 'onchainSafeRejection', params: { requestId: request.id } }]
      }
    })
  }, [cancellationRequest, request, requestsDispatch])

  const handleHoverIn = useCallback(() => {
    onHoverChange(true)
  }, [onHoverChange])

  const handleHoverOut = useCallback(() => {
    onHoverChange(false)
  }, [onHoverChange])

  const getButtonText = () => {
    if (isCancelling) return t('Cancelling...')

    return hasMultipleTransactions ? t('Cancel all') : t('Cancel')
  }

  return (
    <View
      testID={`pending-cancellation-row-${request?.id}`}
      style={[
        styles.cancellationRow,
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.phSm
      ]}
    >
      <Text fontSize={12} weight="medium" appearance="secondaryText" style={flexbox.flex1}>
        {t('{{signedCount}}/{{threshold}} signatures', { signedCount, threshold })}
      </Text>
      <Button
        testID={`pending-cancellation-sign-${request?.id}`}
        type="danger"
        size="small"
        text={getButtonText()}
        disabled={isCancelling}
        onPress={handlePress}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        hasBottomSpacing={false}
        style={[spacings.ml, { minWidth: 76, height: 40 }]}
      />
    </View>
  )
}

export default memo(PendingCancellationRow)
