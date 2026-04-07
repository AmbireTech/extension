import React, { useCallback, useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

import {
  BIP44_LEDGER_DERIVATION_TEMPLATE,
  BIP44_STANDARD_TESTNET_DERIVATION_TEMPLATE,
  DERIVATION_OPTIONS,
  HD_PATH_TEMPLATE_TYPE
} from '@ambire-common/consts/derivation'
import { IAccountPickerController } from '@ambire-common/interfaces/accountPicker'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Button from '@common/components/Button'
import { SelectValue } from '@common/components/Select/types'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import spacings from '@common/styles/spacings'

import AdvancedModeBottomSheet from './AdvancedModeBottomSheet'

type Props = {
  setPage: (page: number) => void
  disabled?: boolean
  type?: IAccountPickerController['type']
}

const ChangeHdPath: React.FC<Props> = ({ setPage, disabled, type }) => {
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { t } = useTranslation()
  const {
    state: { hdPathTemplate, accountsLoading, pageError, page },
    dispatch: accountPickerDispatch
  } = useController('AccountPickerController')

  const value = useMemo(
    () => DERIVATION_OPTIONS.find((o) => o.value === hdPathTemplate),
    [hdPathTemplate]
  )

  const availableOptions = useMemo(
    () =>
      DERIVATION_OPTIONS.filter((d) => {
        // Popular only for Trezor devices, skip for all others to prevent confusion
        if (type !== 'trezor' && d.value === BIP44_STANDARD_TESTNET_DERIVATION_TEMPLATE)
          return false

        return true
      }),
    [type]
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
        text={isWeb ? t('Advanced mode') : undefined}
        childrenPosition="left"
        textStyle={{ fontSize: 14, fontFamily: FONT_FAMILIES.REGULAR }}
        style={isWeb ? undefined : { paddingHorizontal: 0 }}
      >
        <SettingsIcon width={20} style={isWeb ? spacings.mrTy : undefined} />
      </Button>

      <AdvancedModeBottomSheet
        sheetRef={sheetRef}
        disabled={accountsLoading || !!pageError}
        closeBottomSheet={closeBottomSheet}
        page={page}
        value={value}
        options={availableOptions}
        onConfirm={(selectedOption, selectedPage) => handleConfirm(selectedOption, selectedPage)}
      />
    </>
  )
}

export default React.memo(ChangeHdPath)
