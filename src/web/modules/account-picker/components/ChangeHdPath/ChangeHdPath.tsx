import React, { useCallback, useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

import { DERIVATION_OPTIONS, HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Button from '@common/components/Button'
import { SelectValue } from '@common/components/Select/types'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import spacings from '@common/styles/spacings'

import AdvancedModeBottomSheet from './AdvancedModeBottomSheet'

type Props = {
  setPage: (page: number) => void
  disabled?: boolean
}

const ChangeHdPath: React.FC<Props> = ({ setPage, disabled }) => {
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { t } = useTranslation()
  const { dispatch } = useControllersMiddleware()
  const {
    state: { hdPathTemplate, accountsLoading, pageError, page },
    dispatch: accountPickerDispatch
  } = useController('AccountPickerController')

  const value = useMemo(
    () => DERIVATION_OPTIONS.find((o) => o.value === hdPathTemplate),
    [hdPathTemplate]
  )

  const handleChangeHdPath = useCallback(
    (s: SelectValue) => {
      accountPickerDispatch({
        type: 'method',
        params: {
          method: 'setHDPathTemplate',
          args: [{ hdPathTemplate: s.value as HD_PATH_TEMPLATE_TYPE }]
        }
      })
    },
    [accountPickerDispatch]
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
        childrenPosition="left"
        textStyle={{ fontSize: 14, fontFamily: FONT_FAMILIES.REGULAR }}
      >
        <SettingsIcon width={20} style={spacings.mrTy} />
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
