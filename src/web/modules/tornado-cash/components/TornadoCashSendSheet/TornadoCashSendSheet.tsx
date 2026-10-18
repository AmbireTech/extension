import { formatUnits } from 'ethers'
import React, { FC, useMemo, useState } from 'react'
import { View } from 'react-native'

import { TornadoCashOperation } from '@ambire-common/interfaces/tornadoCash'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  operation: TornadoCashOperation | null
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  onSend: () => void
  // Fires once the sheet has left the screen, also when dragged down (unlike `closeBottomSheet`)
  onClosed: () => void
}

/**
 * Confirms a send from a Tornado Cash account, once it is proved and its fee known. The fee is
 * paid from the notes themselves, so the recipient gets the amount minus it.
 */
const TornadoCashSendSheet: FC<Props> = ({
  operation,
  sheetRef,
  closeBottomSheet,
  onSend,
  onClosed
}) => {
  const { t } = useTranslation()
  const { isNarrowWebLayout } = useCompactLayout()

  const isReady = operation?.status === 'pending' && operation.phase === 'ready'
  const isBroadcasting = operation?.status === 'pending' && operation.phase === 'broadcasting'
  const isConfirming = isReady || isBroadcasting
  // Only on mount: later, the screen opens it when a send is proved
  const [shouldOpenOnMount] = useState(isConfirming)

  const rows = useMemo(() => {
    if (!operation) return []
    const format = (amount: bigint | null) =>
      amount === null ? '-' : `${formatUnits(amount, operation.decimals)} ${operation.symbol}`

    return [
      { label: t('Amount to send'), value: format(operation.amount) },
      { label: t('Network fee'), value: format(operation.fee) },
      { label: t('Recipient receives'), value: format(operation.recipientReceives) },
      { label: t('Recipient'), value: shortenAddress(operation.recipient, 13) }
    ]
  }, [operation, t])

  const backButton = (
    <Button
      testID="tornado-cash-send-back"
      type="secondary"
      text={t('Back')}
      onPress={closeBottomSheet}
      hasBottomSpacing={false}
      disabled={isBroadcasting}
      style={isNarrowWebLayout ? { flex: 1, minWidth: 0 } : { width: 98, ...spacings.mrLg }}
      size="smaller"
    />
  )

  return (
    <BottomSheet
      id="tornado-cash-send"
      sheetRef={sheetRef}
      // Not closable while sending: the send goes on anyway and its outcome is shown next
      closeBottomSheet={isBroadcasting ? undefined : closeBottomSheet}
      onClosed={onClosed}
      autoOpen={shouldOpenOnMount}
      backgroundColor="primaryBackground"
    >
      {isConfirming && !!operation && (
        <>
          {rows.map(({ label, value }) => (
            <View
              key={label}
              style={[flexbox.directionRow, flexbox.justifySpaceBetween, spacings.mbSm]}
            >
              <Text fontSize={14} appearance="secondaryText">
                {label}
              </Text>
              <Text fontSize={14} weight="medium">
                {value}
              </Text>
            </View>
          ))}

          {/* Paying the fee from anything else would link it to the send */}
          <Alert
            type="info"
            size="sm"
            style={spacings.mbSm}
            titleWeight="regular"
            title={t('The network fee is deducted automatically from the {{symbol}} you send.', {
              symbol: operation.symbol
            })}
          />

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
              testID="tornado-cash-send-confirm"
              text={t('Send')}
              isLoading={isBroadcasting}
              disabled={isBroadcasting}
              onPress={onSend}
              size="smaller"
              style={isNarrowWebLayout ? { flex: 1, minWidth: 0 } : undefined}
            />
            {isNarrowWebLayout && backButton}
          </FooterGlassView>
        </>
      )}
    </BottomSheet>
  )
}

export default React.memo(TornadoCashSendSheet)
