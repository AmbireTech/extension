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
import { useTranslation } from '@common/config/localization'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import spacings from '@common/styles/spacings'
import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'

import AdvancedModeBottomSheet from './AdvancedModeBottomSheet'

type Props = {
  setPage: (page: number) => void
  disabled?: boolean
  type?: IAccountPickerController['type']
}

const ChangeHdPath: React.FC<Props> = ({ setPage, disabled, type }) => {
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { hdPathTemplate, accountsLoading, pageError, page } = useAccountPickerControllerState()

  const value = useMemo(
    () => DERIVATION_OPTIONS.find((o) => o.value === hdPathTemplate),
    [hdPathTemplate]
  )

  const availableOptions = useMemo(
    () =>
      DERIVATION_OPTIONS.filter((d) => {
        // TODO: Disabled for Trezor because the flow that retrieves accounts
        // from the device as of v4.32.0 throws "forbidden key path" when
        // accessing non-"BIP44 Standard" paths. Alternatively, this could be
        // enabled in Trezor Suit (settings - safety checks), but even if enabled,
        // 1) user must explicitly allow retrieving each address (that means 25
        // clicks to retrieve accounts of the first 5 pages, blah) and 2) The
        // Trezor device shows a scarry note: "Wrong address path for selected
        // coin. Continue at your own risk!", which is pretty bad UX.
        // Note: We can't use the xpub trick because of the hardened part ('), see TrezorKeyIterator
        if (type === 'trezor' && d.value === BIP44_LEDGER_DERIVATION_TEMPLATE) return false
        // Popular only for Trezor devices, skip for all others to prevent confusion
        if (type !== 'trezor' && d.value === BIP44_STANDARD_TESTNET_DERIVATION_TEMPLATE)
          return false

        return true
      }),
    [type]
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
        options={availableOptions}
        onConfirm={(selectedOption, selectedPage) => handleConfirm(selectedOption, selectedPage)}
      />
    </>
  )
}

export default React.memo(ChangeHdPath)
