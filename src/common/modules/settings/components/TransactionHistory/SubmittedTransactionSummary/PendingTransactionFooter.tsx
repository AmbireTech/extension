import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  getReplacementAccountOp,
  getReplacementBlocker,
  Replacement,
  ReplacementBlocker
} from '@ambire-common/libs/accountOp/replacement'
import SpeedUpIcon from '@common/assets/svg/SpeedUpIcon'
import Button from '@common/components/Button'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'

import getStyles from './styles'
import { SubmittedAccountOpLike } from './types'

type Props = {
  submittedAccountOp: SubmittedAccountOpLike
  /** Whether it was sent by the selected account (and not received) */
  isOwnTransaction: boolean
}

// Resets the button if the sign flow never opens, so it can't stay stuck on "Loading..."
const SPEED_UP_LOADING_RESET_TIMEOUT_MS = 5000

const REPLACEMENT_BLOCKER_MESSAGES: Record<ReplacementBlocker, string> = {
  external: 'Incoming transactions cannot be sped up or canceled',
  otherAccount: 'Switch to this account to proceed',
  notReplaceable:
    "This transaction was sent through a service that handles it for you, so it can't be sped up or canceled",
  missingDetails:
    "This transaction can't be sped up or canceled, as some of its details are missing",
  partiallyMined:
    "Part of this transaction has already gone through, so it can't be sped up or canceled"
}

/**
 * The footer of a pending transaction: Cancel and Speed up, which replace it with a new
 * transaction in its place (see `getReplacementAccountOp`)
 */
const PendingTransactionFooter: FC<Props> = ({ submittedAccountOp, isOwnTransaction }) => {
  const { styles } = useTheme(getStyles)
  const { bottom } = useSafeAreaInsets()
  const { isCompactLayout } = useCompactLayout()
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { t } = useTranslation()
  const [loadingReplacement, setLoadingReplacement] = useState<Replacement | null>(null)

  const blocker = getReplacementBlocker(submittedAccountOp, isOwnTransaction)
  const disabledReason = blocker ? t(REPLACEMENT_BLOCKER_MESSAGES[blocker]) : null
  const isDisabled = !!disabledReason || !!loadingReplacement

  useEffect(() => {
    if (!loadingReplacement) return

    const timeout = setTimeout(() => setLoadingReplacement(null), SPEED_UP_LOADING_RESET_TIMEOUT_MS)

    return () => clearTimeout(timeout)
  }, [loadingReplacement])

  const handleReplaceTransaction = useCallback(
    (replacement: Replacement) => {
      const accountOp = getReplacementAccountOp(submittedAccountOp, replacement)
      if (!accountOp) return

      // There is a short pause before the sign flow opens, so give instant feedback
      setLoadingReplacement(replacement)

      requestsDispatch({
        type: 'method',
        params: {
          method: 'build',
          args: [
            {
              type: 'calls',
              params: {
                userRequestParams: {
                  calls: accountOp.calls,
                  meta: { chainId: accountOp.chainId, accountAddr: accountOp.accountAddr },
                  accountOp
                }
              }
            }
          ]
        }
      })
    },
    [submittedAccountOp, requestsDispatch]
  )

  const handleCancel = useCallback(
    () => handleReplaceTransaction('cancel'),
    [handleReplaceTransaction]
  )

  const handleSpeedUp = useCallback(
    () => handleReplaceTransaction('speedUp'),
    [handleReplaceTransaction]
  )

  const getTooltipDataSet = useCallback(
    (id: string) =>
      createGlobalTooltipDataSet({
        id: `${id}-disabled-${submittedAccountOp.id}`,
        content: disabledReason ?? '',
        hidden: !disabledReason
      }),
    [disabledReason, submittedAccountOp.id]
  )

  const buttonStyle = useMemo(
    () => [styles.footerButton, isMobile && { height: 46 }, { width: '100%' as const }],
    [styles.footerButton]
  )
  const buttonSize = isMobile ? 'regular' : 'smaller'

  return (
    <View
      style={[
        styles.footer,
        isCompactLayout && (isMobile ? { paddingBottom: bottom || SPACING_SM } : spacings.phSm)
      ]}
    >
      {/* Cancel and Speed up share the row equally */}
      <View style={[styles.footerButtonsRow, { columnGap: SPACING_SM }]}>
        <View style={styles.footerButtonWrapper} dataSet={getTooltipDataSet('cancel')}>
          <Button
            type="danger"
            text={loadingReplacement === 'cancel' ? t('Loading...') : t('Cancel')}
            onPress={handleCancel}
            size={buttonSize}
            hasBottomSpacing={false}
            disabled={isDisabled}
            style={buttonStyle}
            testID="cancel-pending-transaction"
          />
        </View>
        <View style={styles.footerButtonWrapper} dataSet={getTooltipDataSet('speed-up')}>
          <Button
            type="primary"
            text={loadingReplacement === 'speedUp' ? t('Loading...') : t('Speed up')}
            onPress={handleSpeedUp}
            size={buttonSize}
            hasBottomSpacing={false}
            disabled={isDisabled}
            style={buttonStyle}
            childrenPosition="left"
            testID="speed-up-pending-transaction"
          >
            <SpeedUpIcon style={spacings.mrMi} width={20} height={20} />
          </Button>
        </View>
      </View>
    </View>
  )
}

export default React.memo(PendingTransactionFooter)
