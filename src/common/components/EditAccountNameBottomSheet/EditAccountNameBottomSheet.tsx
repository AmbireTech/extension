import React, { useCallback, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
import Avatar from '@common/components/Avatar'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import GlassView from '@common/components/GlassView'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

/** The longest account name a user can enter */
export const ACCOUNT_NAME_MAX_LENGTH = 40

const WIDE_MODAL_STYLE: ViewStyle = { maxWidth: 400, ...spacings.pvLg, ...spacings.phLg }

type Props = {
  account: Account
  /** The name as currently stored, which the input starts with */
  currentName: string
  /**
   * Saves the new name. The sheet keeps loading until the returned promise settles,
   * then closes on success or shows an error and stays open on failure
   */
  onSave: (name: string) => Promise<void>
  /** Called once the closing animation ends, so the caller can unmount the sheet */
  onClosed: () => void
  testID?: string
}

/**
 * A modal (a bottom sheet on narrow screens and mobile) for renaming an account.
 * Opens itself on mount and closes itself once the new name is saved.
 */
const EditAccountNameBottomSheet = ({
  account,
  currentName,
  onSave,
  onClosed,
  testID = 'edit-account-name'
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { isCompactLayout } = useCompactLayout()
  const { ref: sheetRef, close } = useModalize()
  const [name, setName] = useState(currentName)
  const [isSaving, setIsSaving] = useState(false)

  const trimmedName = name.trim()
  const canSave = !!trimmedName && trimmedName !== currentName && !isSaving

  // The save can't be called back once sent, so the sheet stays open until it settles
  const handleClose = useCallback(() => {
    if (isSaving) return

    close()
  }, [close, isSaving])

  const handleSave = useCallback(async () => {
    if (!canSave) return

    setIsSaving(true)
    try {
      await onSave(trimmedName)
      addToast(t('Account name updated.'))
      close()
    } catch (error) {
      // Not reported here, as the controller already reports the failed save
      console.error('Saving the account name failed', error)
      setIsSaving(false)
      addToast(t("Couldn't save the new name. Please try again."), { type: 'error' })
    }
  }, [addToast, canSave, close, onSave, t, trimmedName])

  const renderButtons = ({ buttonStyle }: { buttonStyle?: ViewStyle } = {}) => [
    <Button
      type="secondary"
      size="smaller"
      text={t('Cancel')}
      onPress={handleClose}
      disabled={isSaving}
      hasBottomSpacing={false}
      style={buttonStyle}
      testID={`${testID}-cancel-button`}
      key="cancel"
    />,
    <ButtonWithLoader
      type="primary"
      size="smaller"
      text={isSaving ? '' : t('Save')}
      onPress={handleSave}
      disabled={!canSave}
      isLoading={isSaving}
      style={buttonStyle}
      testID={`${testID}-save-button`}
      key="save"
    />
  ]

  return (
    <BottomSheet
      id="edit-account-name"
      // Narrow screens (side panel, mobile) get a regular bottom sheet, wide screens a centered modal
      type={isCompactLayout ? 'bottom-sheet' : 'modal'}
      sheetRef={sheetRef}
      closeBottomSheet={handleClose}
      shouldBeClosableOnDrag={!isSaving}
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
        {t('Edit account name')}
      </Text>
      <View style={[flexbox.alignCenter, spacings.mbXl]}>
        <Avatar
          address={account.addr}
          pfp={account.preferences.pfp}
          smartAccountType={(account.creation && 'Ambire') || (account.safeCreation && 'Safe')}
          size={48}
          style={spacings.mbSm}
        />
        <Text fontSize={12} appearance="secondaryText" selectable style={text.center}>
          {account.addr}
        </Text>
      </View>
      <Input
        defaultValue={currentName}
        onChangeText={setName}
        onSubmitEditing={handleSave}
        maxLength={ACCOUNT_NAME_MAX_LENGTH}
        label={t('Account name')}
        // The default background is the sheet's own, which hides the field while it isn't focused
        backgroundColor={theme.secondaryBackground}
        autoFocus
        containerStyle={spacings.mb0}
        testID={testID}
      />
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

export default React.memo(EditAccountNameBottomSheet)
