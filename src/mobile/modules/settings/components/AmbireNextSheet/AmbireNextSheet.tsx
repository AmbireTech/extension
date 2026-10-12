import React, { useCallback, useState } from 'react'

import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import {
  AMBIRE_NEXT_ACCESS_CODE_LENGTH,
  joinAmbireNext
} from '@mobile/services/ambireNext/ambireNext'

interface Props {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  onJoined: () => void
}

/** Asks for the Ambire Next access code and joins the early-access release channel with it. */
const AmbireNextSheet = ({ sheetRef, closeBottomSheet, onJoined }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const [accessCode, setAccessCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const isAccessCodeComplete = accessCode.length === AMBIRE_NEXT_ACCESS_CODE_LENGTH

  const handleAccessCodeChange = useCallback((value: string) => {
    setAccessCode(value)
    setErrorMessage('')
  }, [])

  // The access code is a team secret, so it is not kept around after the sheet is closed
  const handleClosed = useCallback(() => {
    setAccessCode('')
    setErrorMessage('')
  }, [])

  const handleJoin = useCallback(async () => {
    if (!isAccessCodeComplete || isJoining) return

    setIsJoining(true)
    try {
      const hasJoined = await joinAmbireNext(accessCode)
      if (!hasJoined) {
        setErrorMessage(t('Did you make this one up?'))
        return
      }

      closeBottomSheet()
      onJoined()
      addToast(
        t(
          'You joined Ambire Next! Preview versions will download in the background when available.'
        )
      )
    } catch (error) {
      captureException(error)
      addToast(t('Joining Ambire Next failed. Check your internet connection and try again.'), {
        type: 'error'
      })
    } finally {
      setIsJoining(false)
    }
  }, [accessCode, addToast, closeBottomSheet, isAccessCodeComplete, isJoining, onJoined, t])

  return (
    <BottomSheet
      id="ambire-next"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={handleClosed}
    >
      <ModalHeader handleClose={closeBottomSheet} title={t('Ambire Next')} />
      <Text fontSize={16} appearance="secondaryText" style={spacings.mbLg}>
        {t(
          'Join the preview version of Ambire, intended for early access and testing new features before the main release.'
        )}
      </Text>
      <Input
        placeholder={t('Access code')}
        value={accessCode}
        onChangeText={handleAccessCodeChange}
        onSubmitEditing={handleJoin}
        editable={!isJoining}
        error={errorMessage}
        maxLength={AMBIRE_NEXT_ACCESS_CODE_LENGTH}
        keyboardType="number-pad"
        containerStyle={spacings.mbLg}
        backgroundColor={theme.secondaryBackground}
        autoComplete="off"
        autoCorrect={false}
        returnKeyType="done"
      />
      <Button
        type="primary"
        text={isJoining ? t('Joining...') : t('Join')}
        disabled={!isAccessCodeComplete || isJoining}
        onPress={handleJoin}
        hasBottomSpacing={false}
      />
    </BottomSheet>
  )
}

export default React.memo(AmbireNextSheet)
