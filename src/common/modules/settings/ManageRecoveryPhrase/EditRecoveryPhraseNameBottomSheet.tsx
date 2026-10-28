import React, { useCallback, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

/** The longest recovery phrase name a user can enter */
const RECOVERY_PHRASE_NAME_MAX_LENGTH = 40
/** The longest text a user can enter after "Passphrase" */
const PASSPHRASE_NAME_MAX_LENGTH = 30

const WIDE_MODAL_STYLE: ViewStyle = { maxWidth: 400, ...spacings.pvLg, ...spacings.phLg }

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
  const { addToast } = useToast()
  const { isCompactLayout } = useCompactLayout()
  const { ref: sheetRef, close } = useModalize()
  const { dispatch: keystoreDispatch } = useController('KeystoreController')
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

  const handleSave = useCallback(() => {
    if (!canSave) return

    keystoreDispatch({
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
    addToast(t('Recovery phrase name updated.'))
    close()
  }, [
    addToast,
    canSave,
    close,
    keystoreDispatch,
    recoveryPhrase.id,
    recoveryPhrase.withPassphrase,
    t,
    trimmedLabel,
    trimmedPassphraseLabel
  ])

  const renderButtons = ({ buttonStyle }: { buttonStyle?: ViewStyle } = {}) => [
    <Button
      type="secondary"
      size="smaller"
      text={t('Cancel')}
      onPress={() => close()}
      hasBottomSpacing={false}
      style={buttonStyle}
      testID="edit-recovery-phrase-name-cancel-button"
      key="cancel"
    />,
    <Button
      type="primary"
      size="smaller"
      text={t('Save')}
      onPress={handleSave}
      disabled={!canSave}
      hasBottomSpacing={false}
      style={buttonStyle}
      testID="edit-recovery-phrase-name-save-button"
      key="save"
    />
  ]

  return (
    <BottomSheet
      id="edit-recovery-phrase-name"
      // Narrow screens (side panel, mobile) get a regular bottom sheet, wide screens a centered modal
      type={isCompactLayout ? 'bottom-sheet' : 'modal'}
      sheetRef={sheetRef}
      closeBottomSheet={close}
      onClosed={onClosed}
      autoOpen
      style={isCompactLayout ? undefined : WIDE_MODAL_STYLE}
      // On narrow screens the buttons stay pinned to the bottom of the sheet
      FooterComponent={
        isCompactLayout && (
          <View style={[flexbox.directionRow, spacings.ptLg, { columnGap: SPACING_SM }]}>
            {/* Unpadded cells, as flex splits the space after each button's own padding and border */}
            {renderButtons().map((button) => (
              <View key={button.key} style={flexbox.flex1}>
                {button}
              </View>
            ))}
          </View>
        )
      }
    >
      <Text fontSize={20} weight="medium" style={[text.center, spacings.mbXl]}>
        {t('Edit name')}
      </Text>
      <Input
        defaultValue={recoveryPhrase.label}
        onChangeText={setLabel}
        onSubmitEditing={handleSave}
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
          onSubmitEditing={handleSave}
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
      {!isCompactLayout && (
        // On wide screens the buttons sit centered in a glass pill instead of filling the width
        <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pt2Xl]}>
          <GlassView borderRadius={28}>
            <View
              style={[
                flexbox.directionRow,
                spacings.phSm,
                spacings.pvSm,
                { columnGap: SPACING_LG }
              ]}
            >
              {renderButtons({ buttonStyle: { minWidth: 99 } })}
            </View>
          </GlassView>
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(EditRecoveryPhraseNameBottomSheet)
