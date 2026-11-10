import React, { FC, useCallback, useMemo, useState } from 'react'

import { PrivacyPoolsOperation } from '@ambire-common/interfaces/privacyPools'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import FooterGlassView from '@common/components/FooterGlassView'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { PrivacySendStatus } from '@common/components/PrivacyStatus'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import spacings, { SPACING_MD, SPACING_TY } from '@common/styles/spacings'

import { TransactionSummaryType } from './loadTransactionSummary'

interface Props {
  operation: PrivacyPoolsOperation | null
  symbol: string
  decimals: number
  /**
   * Loaded by the screen while the transfer is proving. The sheet opens only once it is set, so
   * the summary is there as it slides in. Stays null if it could not be loaded.
   */
  TransactionSummary: TransactionSummaryType | null
  /** Whether loading `TransactionSummary` has finished, successfully or not */
  isTransactionSummaryLoaded: boolean
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  onSend: () => void
  /**
   * Runs the transfer again if it was proved a while ago, as when a popup reopens on it. Asked on
   * every open; the controller skips one proved recently.
   */
  onRecheck: () => void
  // Fires once the sheet has left the screen, also when dragged down (unlike `closeBottomSheet`)
  onClosed: () => void
}

const transactionSummaryStyle = { marginBottom: SPACING_MD }

/**
 * Confirmation of a Privacy Pools transfer, like the regular Send's fee sheet. Opened once the
 * transfer is proved and priced, so the user sees what it does and its fee before Send. Its outcome
 * replaces the whole screen instead, like the regular Send's - see `PrivacyPoolsSendScreen`.
 *
 * Always mounted: a bottom sheet opened in the same commit it mounts does not animate in. Opens by
 * itself when mounted on a transfer to confirm (a popup reopened on it), as the sheet is rendered
 * into a portal the screen cannot open before it is attached - like the regular Send's estimation.
 */
const PrivacyPoolsSendSheet: FC<Props> = ({
  operation,
  symbol,
  decimals,
  TransactionSummary,
  isTransactionSummaryLoaded,
  sheetRef,
  closeBottomSheet,
  onSend,
  onRecheck,
  onClosed
}) => {
  const { t } = useTranslation()
  const { isNarrowWebLayout } = useCompactLayout()

  const isReady = operation?.status === 'pending' && operation.phase === 'ready'
  const isBroadcasting = operation?.status === 'pending' && operation.phase === 'broadcasting'
  const isConfirming = isReady || isBroadcasting
  // A send that weakens or breaks its privacy is never blocked, but the user holds to accept it.
  // So does one nothing could be checked for, as it may break it just as well.
  const privacy = operation?.privacy
  const isPrivacyUnknown = !privacy || privacy.rating === 'unchecked'
  const holdButtonType =
    privacy?.rating === 'traceable'
      ? 'dangerFilled'
      : privacy?.rating === 'weak' || isPrivacyUnknown
        ? 'warning'
        : null
  // Only on mount: later, the screen opens it when a transfer is proved
  const [shouldOpenOnMount] = useState(isConfirming)

  // Only a transfer still to confirm: an ended one has nothing left to check
  const handleOpen = useCallback(() => {
    if (isReady) onRecheck()
  }, [isReady, onRecheck])

  const backButton = useMemo(
    () => (
      <Button
        testID="privacy-pools-send-back"
        type="secondary"
        text={t('Back')}
        onPress={closeBottomSheet}
        hasBottomSpacing={false}
        disabled={isBroadcasting}
        style={isNarrowWebLayout ? { flex: 1, minWidth: 0 } : { width: 98, ...spacings.mrLg }}
        size="smaller"
      />
    ),
    [closeBottomSheet, isBroadcasting, isNarrowWebLayout, t]
  )

  return (
    <BottomSheet
      id="privacy-pools-send"
      sheetRef={sheetRef}
      // Not closable while sending: the transfer goes on anyway and its outcome is shown here
      closeBottomSheet={isBroadcasting ? undefined : closeBottomSheet}
      onOpen={handleOpen}
      onClosed={onClosed}
      // Waits for the summary, so it does not appear after the sheet has opened
      autoOpen={shouldOpenOnMount && isTransactionSummaryLoaded}
      backgroundColor="primaryBackground"
    >
      {!!operation && (
        <>
          {/* Like the transaction details of the one-click Swap & Bridge sheet, the network fee
              among its rows. Not expandable: there is no raw call of the user's account to show */}
          {isConfirming && !!operation.humanization && !!TransactionSummary && (
            <TransactionSummary
              style={transactionSummaryStyle}
              call={operation.humanization}
              chainId={BigInt(operation.chainId)}
              index={0}
              size="md"
              enableExpand={false}
              hideDeleteIcon
            />
          )}

          {/* Paying the fee from anything else would link it to the transfer */}
          {isConfirming && !!operation.quote && (
            // As the title, as the alert shows its icon on the title's row and the text below it
            <Alert
              type="info"
              size="sm"
              style={spacings.mbSm}
              titleWeight="regular"
              title={t('The network fee is deducted automatically from the {{symbol}} you send.', {
                symbol
              })}
            />
          )}

          {/* For the deposits the proof actually spends. The amount can't change here anymore */}
          {isConfirming && !!privacy && (
            <PrivacySendStatus
              rating={privacy.rating}
              leaks={privacy.leaks}
              cover={privacy.cover.bigEnough}
              decimals={decimals}
              symbol={symbol}
              style={spacings.mbSm}
            />
          )}

          {isConfirming && (
            <FooterGlassView
              size="sm"
              absolute={false}
              isSimpleBlur={false}
              style={spacings.pt}
              innerContainerStyle={
                isNarrowWebLayout
                  ? { width: '100%', gap: SPACING_TY, alignItems: 'stretch' }
                  : undefined
              }
            >
              {!isNarrowWebLayout && backButton}
              {holdButtonType && !isBroadcasting ? (
                <HoldToProceedButton
                  testID="privacy-pools-send-confirm"
                  text={t('Hold to send')}
                  completeText={t('Send')}
                  buttonType={holdButtonType}
                  onHoldComplete={onSend}
                  size="smaller"
                  style={isNarrowWebLayout ? { flex: 1, minWidth: 0 } : undefined}
                />
              ) : (
                <ButtonWithLoader
                  testID="privacy-pools-send-confirm"
                  text={t('Send')}
                  isLoading={isBroadcasting}
                  disabled={isBroadcasting}
                  onPress={onSend}
                  size="smaller"
                  style={isNarrowWebLayout ? { flex: 1, minWidth: 0 } : undefined}
                />
              )}
              {/* Back after Send on narrow layouts, like the regular fee sheet */}
              {isNarrowWebLayout && backButton}
            </FooterGlassView>
          )}
        </>
      )}
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsSendSheet)
