import React, { useCallback } from 'react'

import Input from '@common/components/Input'
import { useTranslation } from '@common/config/localization'
import { GEIST_MONO_FONT_FAMILIES } from '@common/hooks/useFonts/constants'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { getStringAsync } from '@common/utils/clipboard'

/** The invite codes thought the history of the project (during extension launch, etc) were always 12 chars long. */
export const INVITE_CODE_LENGTH = 12

// Codes could be copied around with separators in them, so make pasting forgiving,
// depending on how we visually ship them to the users in the diff invite code distr channels.
const SEPARATORS = ['-']

// Copying from a web page or a chat drags along whitespace (leading newlines, tabs,
// non-breaking spaces). Dropping it before the length cap matters, otherwise a single
// stray char shifts a valid code out of the 12 char window and it reads as a typo.
const isNoise = (char: string) => SEPARATORS.includes(char) || char.trim() === ''

/** Strips separators and whitespace noise, then caps the code to {@link INVITE_CODE_LENGTH}. */
export const sanitizeInviteCode = (raw: string) =>
  raw
    .split('')
    .filter((char) => !isNoise(char))
    .slice(0, INVITE_CODE_LENGTH)
    .join('')

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmitEditing: () => void
  editable?: boolean
  error?: string
}

const InviteCodeInput = ({ value, onChange, onSubmitEditing, editable = true, error }: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { theme } = useTheme()

  const handleChangeText = useCallback(
    (nextValue: string) => onChange(sanitizeInviteCode(nextValue)),
    [onChange]
  )

  // Most people arrive here with the code already copied, so offer an explicit
  // paste button instead of relying on the fiddly long-press OS paste menu.
  const handlePaste = useCallback(async () => {
    try {
      const sanitized = sanitizeInviteCode(await getStringAsync())

      if (!sanitized) {
        addToast(t('There is no invite code copied on your device.'), { type: 'error' })
        return
      }

      onChange(sanitized)
    } catch {
      addToast(t('Pasting the invite code failed. Please type it in instead.'), { type: 'error' })
    }
  }, [addToast, onChange, t])

  return (
    <Input
      testID="invite-code-input"
      placeholder={t('Invite code')}
      value={value}
      onChangeText={handleChangeText}
      onSubmitEditing={onSubmitEditing}
      editable={editable}
      button={editable ? t('Paste') : null}
      buttonProps={{ testID: 'paste-invite-code-btn', style: spacings.mrMd }}
      onButtonPress={handlePaste}
      maxLength={INVITE_CODE_LENGTH}
      error={error}
      // Mono font keeps the code's chars evenly spaced and easy to proofread. Note that
      // `letterSpacing` can't be used for this, because on iOS it leaks into the text of
      // inputs mounted afterwards on other screens.
      nativeInputStyle={{ fontSize: 16, fontFamily: GEIST_MONO_FONT_FAMILIES.REGULAR }}
      containerStyle={spacings.mbLg}
      backgroundColor={theme.secondaryBackground}
      autoFocus
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="off"
      spellCheck={false}
      returnKeyType="done"
    />
  )
}

export default React.memo(InviteCodeInput)
