import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isiOS } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { NfcSessionState } from '@common/modules/hardware-wallets/nfc/types'
import { NfcWalletConfigs } from '@common/modules/hardware-wallets/nfc/wallets'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useNfcCardSession from '@mobile/modules/hardware-wallet/hooks/useNfcCardSession'
import keycardNfcService from '@mobile/services/keycard/keycardNfcService'

// Keycard is the only supported card, so the copy can name it. Once a second card
// is added, the one being used must reach this modal through the session state.
const [{ label: CARD_LABEL }] = NfcWalletConfigs

/**
 * iOS puts its own system scan sheet over the app for as long as the NFC session is
 * open, so our tap UI would sit behind it - there the sheet is only needed for the
 * PIN. Android has no such overlay, so it shows the whole session.
 */
const getIsSheetVisible = (step: NfcSessionState['step']) =>
  isiOS ? step === 'awaiting-pin' : step !== 'idle'

interface PinPromptProps {
  error: string | null
  onSubmit: (pin: string) => void
  onCancel: () => void
}

/**
 * The typed PIN is kept here instead of in the modal, so typing re-renders only
 * this subtree. Keeping it in the modal re-renders the whole bottom sheet on every
 * keystroke, which makes the field lag behind and its content jump around.
 * Unmounting on step change is what wipes the PIN - it is never kept across steps.
 */
const PinPrompt: React.FC<PinPromptProps> = ({ error, onSubmit, onCancel }) => {
  const { t } = useTranslation()
  const [pin, setPin] = useState('')

  const handleSubmit = useCallback(() => {
    if (!pin) return

    onSubmit(pin)
  }, [pin, onSubmit])

  return (
    <View style={spacings.pbLg}>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbSm}>
        {t('Your PIN unlocks the card for this one operation only. It is never saved.')}
      </Text>

      <InputPassword
        value={pin}
        onChangeText={setPin}
        onSubmitEditing={handleSubmit}
        keyboardType="number-pad"
        autoFocus
        error={error || undefined}
        placeholder={t('PIN')}
      />

      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtSm]}>
        <Button
          type="secondary"
          text={t('Cancel')}
          onPress={onCancel}
          hasBottomSpacing={false}
          style={[flexbox.flex1, spacings.mrSm]}
        />
        <Button
          text={t('Continue')}
          onPress={handleSubmit}
          disabled={!pin}
          hasBottomSpacing={false}
          style={flexbox.flex1}
        />
      </View>
    </View>
  )
}

const MemoizedPinPrompt = React.memo(PinPrompt)

/**
 * Drives every card tap in the app - both importing accounts and signing.
 * It is mounted globally, because a signing session can start from anywhere
 * (a dapp request, the sign screen, a WalletConnect request).
 *
 * The PIN typed here goes straight to the native NFC service and is wiped when
 * the session ends. It is never stored and never sent to the controllers.
 */
const NfcCardSessionModal = () => {
  const { t } = useTranslation()
  const { ref, open, close } = useModalize()
  const { step, purpose, error, submitPrompt, cancel } = useNfcCardSession()

  const isPrompting = step === 'awaiting-pin'
  // The sheet drives the whole session, importing included, so a card can be read
  // without leaving the screen the import was started from.
  const isVisible = getIsSheetVisible(step)

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [isVisible, open, close])

  // The sheet also closes on its own once it has nothing left to show. Only a close
  // while it should still be up is the user backing out - the step is read live,
  // because this fires after a render.
  const handleClosed = useCallback(() => {
    if (getIsSheetVisible(keycardNfcService.getState().step)) cancel()
  }, [cancel])

  const title = (() => {
    if (step === 'awaiting-pin') return t('{{cardLabel}} PIN', { cardLabel: CARD_LABEL })

    return purpose === 'import' ? t('Tap your card to import') : t('Tap your card to sign')
  })()

  return (
    <BottomSheet
      id="nfc-card-session-modal"
      sheetRef={ref}
      adjustToContentHeight
      autoOpen={isVisible}
      onClosed={handleClosed}
      withBackdropBlur={false}
      shouldBeClosableOnDrag={false}
    >
      <ModalHeader title={title} />

      {isPrompting ? (
        <MemoizedPinPrompt error={error} onSubmit={submitPrompt} onCancel={cancel} />
      ) : (
        <View style={[flexbox.alignCenter, spacings.pbLg]}>
          <Spinner style={{ width: 32, height: 32 }} />
          <Text fontSize={14} style={[spacings.mtSm, { textAlign: 'center' }]}>
            {step === 'awaiting-tap'
              ? t('Hold your card against the top of your phone.')
              : t('Keep the card in place until this finishes.')}
          </Text>
          {step === 'communicating' && (
            <Alert
              type="info"
              size="sm"
              style={spacings.mtSm}
              title={t('Moving the card away now cancels the operation.')}
            />
          )}
          <Button
            type="secondary"
            text={t('Cancel')}
            onPress={cancel}
            hasBottomSpacing={false}
            style={spacings.mtSm}
          />
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(NfcCardSessionModal)
