import { formatUnits } from 'ethers'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import {
  PrivacyPoolsOperation,
  PrivacyPoolsOperationPhase
} from '@ambire-common/interfaces/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CheckIcon from '@common/assets/svg/CheckIcon'
import ErrorFilledIcon from '@common/assets/svg/ErrorFilledIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { formatElapsed } from '@web/modules/privacy-pools/utils/time'

import getStyles from './styles'

interface Props {
  operation: PrivacyPoolsOperation | null
  symbol: string
  decimals: number
  networkName: string
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  onSend: () => void
  // Fires once the sheet has actually left the screen, dragging it down included - which the close
  // handler above does not cover, and which is where a finished withdrawal is dismissed
  onClosed: () => void
}

const STEPS: { phase: PrivacyPoolsOperationPhase; label: string }[] = [
  { phase: 'proving', label: 'Building the proof that hides where the funds came from' },
  { phase: 'ready', label: 'Waiting for you to confirm' },
  { phase: 'broadcasting', label: 'Sending it' },
  { phase: 'finalizing', label: 'Checking what you have left' }
]

const TITLES = {
  pending: 'Withdrawing',
  success: 'Withdrawn',
  failed: 'Withdrawal failed'
}

/**
 * What a withdrawal is doing, while it does it - and the confirmation in the middle of it.
 *
 * The pause on 'ready' is the point of the sheet: the proof takes ten seconds and up and the network
 * fee is not known until the withdrawal is priced, so committing to both before either was shown
 * would mean paying a fee the user never saw. Nothing leaves the pool until the button here is pressed.
 *
 * Always mounted, even with nothing to show: a bottom sheet opened in the same commit it first
 * mounts does not animate in.
 */
const PrivacyPoolsWithdrawalSheet: FC<Props> = ({
  operation,
  symbol,
  decimals,
  networkName,
  sheetRef,
  closeBottomSheet,
  onSend,
  onClosed
}) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  // Starts at 0 rather than at the current time, so nothing impure runs during render - the first
  // tick of the interval below fills it in, and until then the elapsed time reads 0:00.
  const [now, setNow] = useState(0)

  const isRunning = operation?.status === 'pending'
  const isReady = isRunning && operation?.phase === 'ready'

  // One clock per run: restarted when a withdrawal begins, stopped as soon as none is running. It
  // is paused on 'ready' too - the wait there is the user's own, and a timer on it would read as
  // a deadline.
  useEffect(() => {
    if (!isRunning || isReady) return undefined

    const interval = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(interval)
  }, [isRunning, isReady])

  const currentStepIndex = STEPS.findIndex((step) => step.phase === operation?.phase)

  const amountText = useMemo(() => {
    if (!operation) return ''

    return `${formatDecimals(Number(formatUnits(operation.amount, decimals)), 'amount')} ${symbol}`
  }, [operation, decimals, symbol])

  return (
    <BottomSheet
      id="privacy-pools-withdrawal"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={onClosed}
      backgroundColor="primaryBackground"
    >
      {!!operation && (
        <>
          <ModalHeader title={t(TITLES[operation.status])} handleClose={closeBottomSheet} />

          <Text fontSize={16} weight="medium" style={spacings.mbTy}>
            {t('{{amount}} to {{recipient}}', {
              amount: amountText,
              recipient: shortenAddress(operation.recipient, 16)
            })}
          </Text>
          <Text fontSize={12} appearance="secondaryText" style={spacings.mbSm}>
            {networkName}
          </Text>

          {isRunning && (
            <View style={spacings.mbSm}>
              {STEPS.map(({ phase, label }, index) => {
                const isDone = index < currentStepIndex
                const isCurrent = index === currentStepIndex
                // The confirmation step is the user's own wait, not the wallet's, so it gets no
                // spinner - nothing is running while it sits there.
                const isWorking = isCurrent && !isReady

                return (
                  <View key={phase} style={styles.phaseRow}>
                    <View style={styles.phaseIcon}>
                      {isDone && (
                        <CheckIcon width={16} height={16} color={theme.successDecorative} />
                      )}
                      {isWorking && <Spinner style={styles.spinner} />}
                      {!isDone && !isWorking && <View style={styles.phaseDot} />}
                    </View>
                    <Text
                      fontSize={13}
                      weight={isCurrent ? 'medium' : 'regular'}
                      appearance={isCurrent ? 'primaryText' : 'secondaryText'}
                    >
                      {t(label)}
                    </Text>
                    {isWorking && (
                      <Text fontSize={12} appearance="secondaryText" style={spacings.mlTy}>
                        {formatElapsed(now - operation.startedAt)}
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {isRunning && operation.phase === 'proving' && (
            <Alert
              size="sm"
              type="info"
              text={t(
                'This takes up to half a minute, longer on a slower computer. Nothing has left the pool yet.'
              )}
              style={spacings.mbSm}
            />
          )}

          {/* The whole reason the withdrawal stops here: what it costs is only known now. */}
          {isReady && (
            <Alert
              size="sm"
              type="info"
              title={t('Ready to send')}
              text={t(
                'The network fee of {{fee}} {{symbol}} is taken from the withdrawn amount. The address you entered receives {{net}} {{symbol}}.',
                {
                  fee: formatDecimals(
                    Number(formatUnits(operation.quote?.feeAmount ?? 0n, decimals)),
                    'amount'
                  ),
                  net: formatDecimals(
                    Number(formatUnits(operation.quote?.amountAfterFee ?? 0n, decimals)),
                    'amount'
                  ),
                  symbol
                }
              )}
              style={spacings.mbSm}
            />
          )}

          {operation.status === 'success' && (
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
              <CheckIcon width={20} height={20} color={theme.successDecorative} />
              <Text fontSize={13} style={[spacings.mlTy, flexbox.flex1]}>
                {t('The funds are on their way to the address you entered.')}
              </Text>
            </View>
          )}

          {operation.status === 'failed' && (
            <View style={spacings.mbSm}>
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
                <ErrorFilledIcon width={20} height={20} color={theme.errorDecorative} />
                <Text fontSize={13} style={[spacings.mlTy, flexbox.flex1]}>
                  {operation.error || t('Something went wrong.')}
                </Text>
              </View>
              <Text fontSize={12} appearance="secondaryText">
                {/* What can honestly be said about the money follows from how far it got: a failure
                before it was sent spent nothing, while one during sending may have gone through
                already - which the refreshed balance settles. */}
                {operation.phase === 'broadcasting' || operation.phase === 'finalizing'
                  ? t('Check the network above - your pooled balance has just been refreshed.')
                  : t('Nothing left the pool.')}
              </Text>
            </View>
          )}

          {isReady && (
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
              <Button
                testID="privacy-pools-send-withdrawal"
                text={t('Send')}
                onPress={onSend}
                hasBottomSpacing={false}
                style={spacings.mrTy}
              />
              <Button
                text={t('Cancel')}
                type="secondary"
                onPress={closeBottomSheet}
                hasBottomSpacing={false}
              />
            </View>
          )}

          {!isRunning && (
            <View style={spacings.mbSm}>
              <Button text={t('Close')} onPress={closeBottomSheet} hasBottomSpacing={false} />
            </View>
          )}
        </>
      )}
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsWithdrawalSheet)
