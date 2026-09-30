import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsOperation } from '@ambire-common/interfaces/privacyPools'
import CheckIcon from '@common/assets/svg/CheckIcon'
import ErrorFilledIcon from '@common/assets/svg/ErrorFilledIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import PrivacyPoolsNetworkFee from '@web/modules/privacy-pools/components/PrivacyPoolsNetworkFee'

interface Props {
  operation: PrivacyPoolsOperation | null
  symbol: string
  decimals: number
  /** USD price of the sent token, or null when it has none. */
  tokenPrice: number | null
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  onSend: () => void
  // Fires once the sheet has actually left the screen, dragging it down included - which the close
  // handler above does not cover, and which is where a finished transfer is dismissed
  onClosed: () => void
}

/**
 * The confirmation of a transfer from a Privacy Pools account, and what became of it once sent. The
 * counterpart of the regular Send's fee sheet, laid out like it: the network fee, then Back and Send.
 *
 * Opened only once the transfer is proved and priced - the Proceed button carries the wait until
 * then. The network fee is not known before that, and committing to it before it was shown would
 * mean paying a fee the user never saw. Nothing is sent until Send here is pressed.
 *
 * Always mounted, even with nothing to show: a bottom sheet opened in the same commit it first
 * mounts does not animate in.
 */
const PrivacyPoolsSendSheet: FC<Props> = ({
  operation,
  symbol,
  decimals,
  tokenPrice,
  sheetRef,
  closeBottomSheet,
  onSend,
  onClosed
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { isNarrowWebLayout } = useCompactActionRequestLayout()

  const isReady = operation?.status === 'pending' && operation.phase === 'ready'
  const isBroadcasting = operation?.status === 'pending' && operation.phase === 'broadcasting'
  const isConfirming = isReady || isBroadcasting
  const isDone = operation?.status === 'success' || operation?.status === 'failed'

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
      // Not closable while sending: the transfer goes on either way, and this is where its outcome
      // is shown once it is known
      closeBottomSheet={isBroadcasting ? undefined : closeBottomSheet}
      onClosed={onClosed}
      backgroundColor="primaryBackground"
    >
      {!!operation && (
        <>
          {isConfirming && !!operation.quote && (
            <PrivacyPoolsNetworkFee
              chainId={operation.chainId}
              tokenAddress={operation.tokenAddress}
              symbol={symbol}
              decimals={decimals}
              quote={operation.quote}
              tokenPrice={tokenPrice}
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
                  ? t(
                      'Your balance has just been refreshed - check it to see whether the transfer went through.'
                    )
                  : t('Nothing was sent.')}
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
              {/* Narrow layouts stack Back under the primary action, like the regular fee sheet */}
              {isNarrowWebLayout && backButton}
            </FooterGlassView>
          )}

          {isDone && (
            <View style={spacings.mbSm}>
              <Button text={t('Close')} onPress={closeBottomSheet} hasBottomSpacing={false} />
            </View>
          )}
        </>
      )}
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsSendSheet)
