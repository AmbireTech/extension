import React, { FC, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsOperation } from '@ambire-common/interfaces/privacyPools'
import ErrorFilledIcon from '@common/assets/svg/ErrorFilledIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import Completed from '@common/components/TrackProgress/ByStatus/Completed'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import TransactionSummary from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings, { SPACING_MD, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  operation: PrivacyPoolsOperation | null
  symbol: string
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
 * Confirmation and outcome of a Privacy Pools transfer, like the regular Send's fee sheet. Opened
 * once the transfer is proved and priced, so the user sees what it does and its fee before Send.
 *
 * Always mounted: a bottom sheet opened in the same commit it mounts does not animate in. Opens by
 * itself when mounted on a transfer to confirm or one that ended (a popup reopened on it), as the
 * sheet is rendered into a portal the screen cannot open before it is attached - like the regular
 * Send's estimation.
 */
const PrivacyPoolsSendSheet: FC<Props> = ({
  operation,
  symbol,
  sheetRef,
  closeBottomSheet,
  onSend,
  onRecheck,
  onClosed
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { isNarrowWebLayout } = useCompactLayout()

  const isReady = operation?.status === 'pending' && operation.phase === 'ready'
  const isBroadcasting = operation?.status === 'pending' && operation.phase === 'broadcasting'
  const isConfirming = isReady || isBroadcasting
  const isDone = operation?.status === 'success' || operation?.status === 'failed'
  // A failure while sending may still have gone through
  const wasNothingSent =
    operation?.status === 'failed' &&
    operation.phase !== 'broadcasting' &&
    operation.phase !== 'finalizing'
  // Only on mount: later, the screen opens it when a transfer is proved
  const [shouldOpenOnMount] = useState(isConfirming || isDone)

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
      autoOpen={shouldOpenOnMount}
      backgroundColor="primaryBackground"
    >
      {!!operation && (
        <>
          {/* Like the transaction details of the one-click Swap & Bridge sheet, the network fee
              among its rows. Not expandable: there is no raw call of the user's account to show */}
          {isConfirming && !!operation.humanization && (
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

          {/* Like the regular Send's outcome. No explorer link: the transfer's hash is not kept */}
          {operation.status === 'success' && (
            <Completed
              title={t('Sending successfully')}
              titleSecondary={t('Your {{symbol}} is on its way. No trail back to you.', { symbol })}
              openExplorerText={t('View Transfer')}
            />
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
                {wasNothingSent
                  ? t('Nothing was sent.')
                  : t(
                      'Your balance has just been refreshed - check it to see whether the transfer went through.'
                    )}
              </Text>
            </View>
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
              <ButtonWithLoader
                testID="privacy-pools-send-confirm"
                text={t('Send')}
                isLoading={isBroadcasting}
                disabled={isBroadcasting}
                onPress={onSend}
                size="smaller"
                style={isNarrowWebLayout ? { flex: 1, minWidth: 0 } : undefined}
              />
              {/* Back after Send on narrow layouts, like the regular fee sheet */}
              {isNarrowWebLayout && backButton}
            </FooterGlassView>
          )}

          {isDone && (
            <View style={spacings.mbSm}>
              {/* Back to the form, which is kept, to prepare it again */}
              <Button
                testID="privacy-pools-send-done"
                type={wasNothingSent ? 'secondary' : 'primary'}
                text={wasNothingSent ? t('Back') : t('Close')}
                onPress={closeBottomSheet}
                hasBottomSpacing={false}
              />
            </View>
          )}
        </>
      )}
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsSendSheet)
