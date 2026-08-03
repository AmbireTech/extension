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
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useNfcCardSession from '@mobile/modules/hardware-wallet/hooks/useNfcCardSession'

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

  const [promptValue, setPromptValue] = useState('')

  const isPrompting = step === 'awaiting-pin' || step === 'awaiting-pairing-password'
  // While importing, the connect screen is the one showing the tap prompt, so the
  // sheet only comes up for the PIN / pairing password.
  const isVisible = step !== 'idle' && (purpose !== 'import' || isPrompting)

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [isVisible, open, close])

  // Submitting and cancelling are the only ways out of a prompt, and both wipe the
  // typed credential, so it is never kept around across steps.
  const handleSubmit = useCallback(() => {
    if (!promptValue) return

    const value = promptValue
    setPromptValue('')
    submitPrompt(value)
  }, [promptValue, submitPrompt])

  const handleCancel = useCallback(() => {
    setPromptValue('')
    cancel()
  }, [cancel])

  // The sheet also closes on its own once a session finishes, so only treat a
  // close as a cancellation while a session is still running.
  const handleClosed = useCallback(() => {
    if (isVisible) handleCancel()
  }, [isVisible, handleCancel])

  const title = (() => {
    if (step === 'awaiting-pairing-password') return t('Card pairing password')
    if (step === 'awaiting-pin') return t('Enter your card PIN')

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
        <View style={spacings.pbLg}>
          <Text fontSize={14} appearance="secondaryText" style={spacings.mbSm}>
            {step === 'awaiting-pin'
              ? t('Your PIN unlocks the card for this one operation only. It is never saved.')
              : t(
                  'This card is protected with a pairing password. You can find it in the app you set the card up with.'
                )}
          </Text>

          <InputPassword
            value={promptValue}
            onChangeText={setPromptValue}
            onSubmitEditing={handleSubmit}
            keyboardType={step === 'awaiting-pin' ? 'number-pad' : 'default'}
            autoFocus
            error={error || undefined}
            placeholder={step === 'awaiting-pin' ? t('PIN') : t('Pairing password')}
          />

          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtSm]}>
            <Button
              type="secondary"
              text={t('Cancel')}
              onPress={handleCancel}
              hasBottomSpacing={false}
              style={[flexbox.flex1, spacings.mrSm]}
            />
            <Button
              text={t('Continue')}
              onPress={handleSubmit}
              disabled={!promptValue}
              hasBottomSpacing={false}
              style={flexbox.flex1}
            />
          </View>
        </View>
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
            onPress={handleCancel}
            hasBottomSpacing={false}
            style={spacings.mtSm}
          />
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(NfcCardSessionModal)
