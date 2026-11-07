import React, { useCallback, useState } from 'react'

import EditNameBottomSheet from '@common/components/EditNameBottomSheet'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

/** The longest recovery phrase name a user can enter */
const RECOVERY_PHRASE_NAME_MAX_LENGTH = 40
/** The longest text a user can enter after "Passphrase" */
const PASSPHRASE_NAME_MAX_LENGTH = 30

type Props = {
  recoveryPhrase: { id: string; label: string; withPassphrase: boolean; passphraseLabel?: string }
  /** Called once the closing animation ends, so the caller can unmount the sheet */
  onClosed: () => void
}

/**
 * A modal (a bottom sheet on narrow screens and mobile) for renaming a recovery phrase and, for one
 * added with a passphrase, the passphrase - only what follows "Passphrase". Renames only this
 * phrase, not the others with the same words. Opens itself on mount and closes once saved.
 */
const EditRecoveryPhraseNameBottomSheet = ({ recoveryPhrase, onClosed }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { dispatchAndWait: keystoreDispatchAndWait } = useController('KeystoreController')
  const [label, setLabel] = useState(recoveryPhrase.label)
  const [passphraseLabel, setPassphraseLabel] = useState(recoveryPhrase.passphraseLabel || '')

  const trimmedLabel = label.trim()
  const trimmedPassphraseLabel = passphraseLabel.trim()
  const isPassphraseLabelValid = !recoveryPhrase.withPassphrase || !!trimmedPassphraseLabel
  const hasChanges =
    trimmedLabel !== recoveryPhrase.label ||
    (recoveryPhrase.withPassphrase &&
      trimmedPassphraseLabel !== (recoveryPhrase.passphraseLabel || ''))
  const canSave = !!trimmedLabel && isPassphraseLabelValid && hasChanges

  const handleSave = useCallback(async () => {
    await keystoreDispatchAndWait({
      type: 'method',
      params: {
        method: 'updateSeed',
        args: [
          {
            id: recoveryPhrase.id,
            label: trimmedLabel,
            ...(recoveryPhrase.withPassphrase && { passphraseLabel: trimmedPassphraseLabel })
          }
        ]
      }
    })
  }, [
    keystoreDispatchAndWait,
    recoveryPhrase.id,
    recoveryPhrase.withPassphrase,
    trimmedLabel,
    trimmedPassphraseLabel
  ])

  return (
    <EditNameBottomSheet
      id="edit-recovery-phrase-name"
      title={t('Edit name')}
      canSave={canSave}
      onSave={handleSave}
      successMessage={t('Recovery phrase name updated.')}
      onClosed={onClosed}
      testID="edit-recovery-phrase-name"
    >
      {(save) => (
        <>
          <Input
            defaultValue={recoveryPhrase.label}
            onChangeText={setLabel}
            onSubmitEditing={save}
            maxLength={RECOVERY_PHRASE_NAME_MAX_LENGTH}
            label={t('Recovery phrase name')}
            // The default background is the sheet's own, which hides the field while it isn't focused
            backgroundColor={theme.secondaryBackground}
            autoFocus
            containerStyle={recoveryPhrase.withPassphrase ? spacings.mbMd : spacings.mb0}
            testID="edit-recovery-phrase-name-input"
          />
          {recoveryPhrase.withPassphrase && (
            <Input
              defaultValue={recoveryPhrase.passphraseLabel}
              onChangeText={setPassphraseLabel}
              onSubmitEditing={save}
              maxLength={PASSPHRASE_NAME_MAX_LENGTH}
              label={t('Passphrase name')}
              // The word "Passphrase" is fixed, only what follows it can be changed
              leftIcon={() => (
                <Text fontSize={14} appearance="tertiaryText">
                  {t('Passphrase')}
                </Text>
              )}
              backgroundColor={theme.secondaryBackground}
              containerStyle={spacings.mb0}
              testID="edit-passphrase-name-input"
            />
          )}
        </>
      )}
    </EditNameBottomSheet>
  )
}

export default React.memo(EditRecoveryPhraseNameBottomSheet)
