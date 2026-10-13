import React, { useCallback, useEffect, useState } from 'react'
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
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

/** The longest account name a user can enter */
export const ACCOUNT_NAME_MAX_LENGTH = 40

/** How long to wait for a saved name to show up before telling the user it failed */
const SAVE_TIMEOUT_MS = 10_000

const WIDE_MODAL_STYLE: ViewStyle = { maxWidth: 400, ...spacings.pvLg, ...spacings.phLg }

type Props = {
  account: Account
  /**
   * The name as currently stored. The sheet keeps loading after Save until this
   * equals the new name, so it must come from the source the save updates
   */
  currentName: string
  onSave: (name: string) => void
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
  const { addToast } = useToast()
  const { isCompactLayout } = useCompactLayout()
  const { ref: sheetRef, close } = useModalize()
  const [name, setName] = useState(currentName)
  const [pendingName, setPendingName] = useState<string | null>(null)

  const trimmedName = name.trim()
  const isSaving = pendingName !== null
  const canSave = !!trimmedName && trimmedName !== currentName && !isSaving

  const handleCancel = useCallback(() => close(), [close])

  const handleSave = useCallback(() => {
    if (!canSave) return

    setPendingName(trimmedName)
    onSave(trimmedName)
  }, [canSave, onSave, trimmedName])

  const renderButtons = ({
    buttonStyle,
    isPrimaryFirst = false
  }: { buttonStyle?: ViewStyle; isPrimaryFirst?: boolean } = {}) => {
    const cancelButton = (
      <Button
        type="secondary"
        size="smaller"
        text={t('Cancel')}
        onPress={handleCancel}
        hasBottomSpacing={false}
        style={buttonStyle}
        testID={`${testID}-cancel-button`}
      />
    )
    const saveButton = (
      <ButtonWithLoader
        type="primary"
        size="smaller"
        text={isSaving ? '' : t('Save')}
        onPress={handleSave}
        disabled={!canSave}
        isLoading={isSaving}
        style={buttonStyle}
        testID={`${testID}-save-button`}
      />
    )

    return isPrimaryFirst ? (
      <>
        {saveButton}
        {cancelButton}
      </>
    ) : (
      <>
        {cancelButton}
        {saveButton}
      </>
    )
  }

  useEffect(() => {
    if (pendingName === null) return

    if (currentName === pendingName) {
      addToast(t('Account name updated.'))
      close()
      return
    }

    const timeoutId = setTimeout(() => {
      setPendingName(null)
      addToast(t("Couldn't save the new name. Please try again."), { type: 'error' })
      captureException(new Error('Saving the account name timed out'))
    }, SAVE_TIMEOUT_MS)

    return () => clearTimeout(timeoutId)
  }, [addToast, close, currentName, pendingName, t])

  return (
    <BottomSheet
      id="edit-account-name"
      // Narrow screens (side panel, mobile) get a regular bottom sheet, wide screens a centered modal
      type={isCompactLayout ? 'bottom-sheet' : 'modal'}
      sheetRef={sheetRef}
      closeBottomSheet={close}
      onClosed={onClosed}
      autoOpen
      style={isCompactLayout ? undefined : WIDE_MODAL_STYLE}
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
        value={name}
        onChangeText={setName}
        onSubmitEditing={handleSave}
        maxLength={ACCOUNT_NAME_MAX_LENGTH}
        placeholder={t('Account name')}
        autoFocus
        containerStyle={spacings.mb0}
        testID={testID}
      />
      {isCompactLayout ? (
        <View style={[spacings.ptLg, { rowGap: SPACING_SM }]}>
          {renderButtons({ isPrimaryFirst: true })}
        </View>
      ) : (
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
