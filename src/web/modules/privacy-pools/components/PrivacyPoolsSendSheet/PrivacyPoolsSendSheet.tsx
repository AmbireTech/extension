import React, { FC, useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import {
  PrivacyPoolsBroadcaster,
  PrivacyPoolsOperation,
  PrivacyPoolsRating
} from '@ambire-common/interfaces/privacyPools'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import FooterGlassView from '@common/components/FooterGlassView'
import HoldToProceedButton from '@common/components/HoldToProceedButton'
import { PrivacySendStatus } from '@common/components/PrivacyStatus'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import spacings, { SPACING_MD, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import PrivacyPoolsLoadingTexts from '@web/modules/privacy-pools/components/PrivacyPoolsLoadingTexts'

import { TransactionSummaryType } from './loadTransactionSummary'
import PrivacyPoolsSendSummarySkeleton from './PrivacyPoolsSendSummarySkeleton'

/**
 * A send that weakens or breaks its privacy is never blocked, but the user holds to accept it.
 * So does one nothing could be checked for, as it may break it just as well. Null for a send with
 * a `standard` rating, which sends with a tap.
 */
const getHoldButtonType = (rating: PrivacyPoolsRating | undefined) => {
  if (rating === 'standard') return null
  if (rating === 'traceable') return 'dangerFilled'

  return 'warning'
}

interface Props {
  operation: PrivacyPoolsOperation | null
  symbol: string
  decimals: number
  /**
   * Loaded by the screen while the user fills in the form. A sheet opened on a transfer to confirm
   * waits for it, so the summary is there as it slides in. Stays null if it could not be loaded.
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
 * As tall as the privacy line with its suggestions badge, so the line takes the same room with or
 * without one, and while it is hidden as the transfer is proved.
 */
const PRIVACY_LINE_MIN_HEIGHT = 20
const privacyLineStyle = [
  spacings.mbSm,
  flexbox.justifyCenter,
  { minHeight: PRIVACY_LINE_MIN_HEIGHT }
]

/** Through 0xBow the relayer's service fee is taken too, besides the network fee. Translated where shown. */
const FEE_NOTICES: { [broadcaster in PrivacyPoolsBroadcaster]: string } = {
  '0xbow': 'The service and network fees are deducted automatically from the {{symbol}} you send.',
  kohaku: 'The network fee is deducted automatically from the {{symbol}} you send.'
}

/**
 * Confirmation of a Privacy Pools transfer, like the regular Send's fee sheet. Opened on Proceed,
 * with skeletons and loading texts while the transfer is proved and priced, so the user then
 * sees what it does and its fee before Send. Not closable meanwhile; leaving the screen cancels
 * it. Its outcome replaces the whole screen instead, like the regular Send's - see
 * `PrivacyPoolsSendScreen`.
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

  const isProving = operation?.status === 'pending' && operation.phase === 'proving'
  const isReady = operation?.status === 'pending' && operation.phase === 'ready'
  const isBroadcasting = operation?.status === 'pending' && operation.phase === 'broadcasting'
  const isConfirming = isReady || isBroadcasting
  const isShown = isProving || isConfirming
  // The screen opens the sheet without waiting for the summary, which may still be loading then
  const isSummaryLoading = isProving || (isConfirming && !isTransactionSummaryLoaded)
  const privacy = operation?.privacy
  const holdButtonType = getHoldButtonType(privacy?.rating)
  // Only on mount: later, the screen opens it when the user proceeds
  const [shouldOpenOnMount] = useState(isShown)

  // Only a transfer still to confirm: an ended one has nothing left to check
  const handleOpen = useCallback(() => {
    if (isReady) onRecheck()
  }, [isReady, onRecheck])

  return (
    <BottomSheet
      id="privacy-pools-send"
      sheetRef={sheetRef}
      // Not closable while proving, as closing would not stop it, or while sending: the transfer
      // goes on anyway and its outcome is shown here
      closeBottomSheet={isProving || isBroadcasting ? undefined : closeBottomSheet}
      onOpen={handleOpen}
      onClosed={onClosed}
      // Waits for the summary, so it does not appear after the sheet has opened
      autoOpen={shouldOpenOnMount && isTransactionSummaryLoaded}
      backgroundColor="primaryBackground"
    >
      {/* The sheet's X closes it, as on the one-click fee sheet. An ended transfer shows its outcome */}
      <ModalHeader title={isShown ? t('Confirm send') : undefined} />
      {!!operation && (
        <>
          {/* Like the transaction details of the one-click Swap & Bridge sheet, the fee among its
              rows. Not expandable: there is no raw call of the user's account to show */}
          {isShown && isSummaryLoading && (
            <PrivacyPoolsSendSummarySkeleton
              broadcaster={operation.broadcaster}
              style={transactionSummaryStyle}
            />
          )}
          {isConfirming &&
            !isSummaryLoading &&
            !!operation.humanization &&
            !!TransactionSummary && (
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

          {/* While proving, the fee notice and the privacy line are hidden but keep their room, so
              nothing moves once they show. The loading texts sit over them, right above Send */}
          {isShown && (
            <View>
              <View style={isProving && styles.hidden} aria-hidden={isProving}>
                {/* Paying the fee from anything else would link it to the transfer. As the title,
                    as the alert shows its icon on the title's row and the text below it */}
                <Alert
                  type="info"
                  size="sm"
                  style={spacings.mbSm}
                  titleWeight="regular"
                  title={t(FEE_NOTICES[operation.broadcaster], { symbol })}
                />

                {/* For the deposits the proof actually spends. The amount can't change here
                    anymore */}
                <View style={privacyLineStyle}>
                  {isConfirming && !!privacy && (
                    <PrivacySendStatus
                      rating={privacy.rating}
                      leaks={privacy.leaks}
                      cover={privacy.cover.bigEnough}
                      decimals={decimals}
                      symbol={symbol}
                    />
                  )}
                </View>
              </View>
              {isProving && (
                <View style={[StyleSheet.absoluteFill, flexbox.justifyEnd]}>
                  <PrivacyPoolsLoadingTexts />
                </View>
              )}
            </View>
          )}

          {isShown && (
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
              {holdButtonType && isReady ? (
                <HoldToProceedButton
                  testID="privacy-pools-send-confirm"
                  text={t('Hold to send')}
                  completeText={t('Send')}
                  buttonType={holdButtonType}
                  onHoldComplete={onSend}
                  size="regular"
                  style={isNarrowWebLayout ? { width: '100%', minWidth: 0 } : undefined}
                />
              ) : (
                <ButtonWithLoader
                  testID="privacy-pools-send-confirm"
                  text={t('Send')}
                  isLoading={isProving || isBroadcasting}
                  disabled={isProving || isBroadcasting}
                  onPress={onSend}
                  size="regular"
                  style={isNarrowWebLayout ? { width: '100%', minWidth: 0 } : undefined}
                />
              )}
            </FooterGlassView>
          )}
        </>
      )}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({ hidden: { opacity: 0 } })

export default React.memo(PrivacyPoolsSendSheet)
