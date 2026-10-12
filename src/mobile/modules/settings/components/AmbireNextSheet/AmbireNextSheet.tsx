import React, { useCallback, useRef, useState } from 'react'

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
  joinAmbireNext,
  leaveAmbireNext
} from '@mobile/services/ambireNext/ambireNext'

interface Props {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  isJoined: boolean
  onIsJoinedChange: (isJoined: boolean) => void
}

/**
 * Joins the Ambire Next early-access release channel with its access code,
 * or leaves it when the device has already joined.
 */
const AmbireNextSheet = ({ sheetRef, closeBottomSheet, isJoined, onIsJoinedChange }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const [accessCode, setAccessCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  // Applied once the sheet has closed, otherwise its content would switch between
  // joining and leaving in the middle of the closing animation
  const pendingIsJoinedRef = useRef<boolean | null>(null)

  const isAccessCodeComplete = accessCode.length === AMBIRE_NEXT_ACCESS_CODE_LENGTH

  const handleAccessCodeChange = useCallback((value: string) => {
    setAccessCode(value)
    setErrorMessage('')
  }, [])

  const handleClosed = useCallback(() => {
    // The access code is a team secret, so it is not kept around after the sheet is closed
    setAccessCode('')
    setErrorMessage('')

    if (pendingIsJoinedRef.current === null) return

    onIsJoinedChange(pendingIsJoinedRef.current)
    pendingIsJoinedRef.current = null
  }, [onIsJoinedChange])

  const handleJoin = useCallback(async () => {
    if (!isAccessCodeComplete || isJoining) return

    setIsJoining(true)
    try {
      const hasJoined = await joinAmbireNext(accessCode)
      if (!hasJoined) {
        setErrorMessage(t('Did you make this one up?'))
        return
      }

      pendingIsJoinedRef.current = true
      closeBottomSheet()
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
  }, [accessCode, addToast, closeBottomSheet, isAccessCodeComplete, isJoining, t])

  const handleLeave = useCallback(async () => {
    try {
      await leaveAmbireNext()
      pendingIsJoinedRef.current = false
      closeBottomSheet()
      addToast(
        t(
          'You left Ambire Next. The preview version stays on your device until the next update of the main release replaces it.'
        )
      )
    } catch (error) {
      captureException(error)
      addToast(t('Leaving Ambire Next failed. Please try again.'), { type: 'error' })
    }
  }, [addToast, closeBottomSheet, t])

  return (
    <BottomSheet
      id="ambire-next"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={handleClosed}
    >
      <ModalHeader handleClose={closeBottomSheet} title={t('Ambire Next')} />
      {isJoined ? (
        <>
          <Text fontSize={16} appearance="secondaryText" style={spacings.mbLg}>
            {t(
              'You get the preview version of Ambire Wallet, intended for early access and testing new features before the main release.'
            )}
          </Text>
          <Button
            type="danger"
            text={t('Leave Ambire Next')}
            onPress={handleLeave}
            hasBottomSpacing={false}
          />
        </>
      ) : (
        <>
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
        </>
      )}
    </BottomSheet>
  )
}

export default React.memo(AmbireNextSheet)
