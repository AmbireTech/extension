import React, { ReactNode, useCallback, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import GlassView from '@common/components/GlassView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

const WIDE_MODAL_STYLE: ViewStyle = { maxWidth: 400, ...spacings.pvLg, ...spacings.phLg }

type Props = {
  /** The bottom sheet's id */
  id: string
  title: string
  /** Whether the entered name can be saved, e.g. it is not empty and differs from the current */
  canSave: boolean
  /**
   * Saves the new name. The sheet keeps loading until the returned promise settles,
   * then closes on success or shows an error and stays open on failure
   */
  onSave: () => Promise<void>
  /** The toast shown once the name is saved */
  successMessage: string
  /** Called once the closing animation ends, so the caller can unmount the sheet */
  onClosed: () => void
  /** Prefixes the buttons' test ids */
  testID: string
  /** The sheet's content, given the save to call when an input is submitted */
  children: (save: () => void) => ReactNode
}

/**
 * A modal (a bottom sheet on narrow screens and mobile) for renaming something, e.g. an account.
 * Opens itself on mount and closes itself once the new name is saved.
 */
const EditNameBottomSheet = ({
  id,
  title,
  canSave: canSaveName,
  onSave,
  successMessage,
  onClosed,
  testID,
  children
}: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { isCompactLayout } = useCompactLayout()
  const { ref: sheetRef, close } = useModalize()
  const [isSaving, setIsSaving] = useState(false)

  const canSave = canSaveName && !isSaving

  // The save can't be called back once sent, so the sheet stays open until it settles
  const handleClose = useCallback(() => {
    if (isSaving) return

    close()
  }, [close, isSaving])

  const handleSave = useCallback(async () => {
    if (!canSave) return

    setIsSaving(true)
    try {
      await onSave()
      addToast(successMessage)
      close()
    } catch (error) {
      // Not reported here, as the controller already reports the failed save
      console.error('Saving the name failed', error)
      setIsSaving(false)
      addToast(t("Couldn't save the new name. Please try again."), { type: 'error' })
    }
  }, [addToast, canSave, close, onSave, successMessage, t])

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
      id={id}
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
        {title}
      </Text>
      {children(handleSave)}
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

export default EditNameBottomSheet
