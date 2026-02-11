import React, { useCallback, useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

import { DERIVATION_OPTIONS, HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Button from '@common/components/Button'
import { SelectValue } from '@common/components/Select/types'
import { useTranslation } from '@common/config/localization'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import spacings from '@common/styles/spacings'
import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'

import AdvancedModeBottomSheet from './AdvancedModeBottomSheet'

type Props = {
  setPage: (page: number) => void
  disabled?: boolean
}

const ChangeHdPath: React.FC<Props> = ({ setPage, disabled }) => {
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { hdPathTemplate, accountsLoading, pageError, page } = useAccountPickerControllerState()

  const value = useMemo(
    () => DERIVATION_OPTIONS.find((o) => o.value === hdPathTemplate),
    [hdPathTemplate]
  )

  const handleChangeHdPath = useCallback(
    (s: SelectValue) => {
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_SET_HD_PATH_TEMPLATE',
        params: { hdPathTemplate: s.value as HD_PATH_TEMPLATE_TYPE }
      })
    },
    [dispatch]
  )

  const handleConfirm = useCallback(
    (selectedOption: SelectValue, selectedPage: number) => {
      handleChangeHdPath(selectedOption)
      setPage(selectedPage)
    },
    [handleChangeHdPath, setPage]
  )

  if (!value) return null // should never happen

  return (
    <>
      <Button
        testID="change-hd-path-btn"
        size="small"
        type="ghost2"
        onPress={() => openBottomSheet()}
        hasBottomSpacing={false}
        disabled={disabled}
        text={t('Advanced mode')}
        textStyle={{ fontSize: 14, fontFamily: FONT_FAMILIES.REGULAR }}
      >
        <SettingsIcon width={16} style={spacings.mlTy} />
      </Button>

      <AdvancedModeBottomSheet
        sheetRef={sheetRef}
        disabled={accountsLoading || !!pageError}
        closeBottomSheet={closeBottomSheet}
        page={page}
        value={value}
        options={DERIVATION_OPTIONS}
        onConfirm={(selectedOption, selectedPage) => handleConfirm(selectedOption, selectedPage)}
      />
    </>
  )
}

export default React.memo(ChangeHdPath)
