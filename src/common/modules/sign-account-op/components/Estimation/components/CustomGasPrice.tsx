import { parseUnits, toBeHex } from 'ethers'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { Hex } from '@ambire-common/interfaces/hex'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { GasSpeeds } from '@ambire-common/services/bundlers/types'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import NumberInput from '@common/components/NumberInput'
import spacings from '@common/styles/spacings'

type CustomGasPriceInputProps = {
  initialAmount: string
  backgroundColor: ColorValue
  onSanitizedAmountChange: (value: string) => void
  inputError: string | boolean
  label: string
  autoFocus?: boolean
}

const CustomGasPriceInput = memo(
  ({
    initialAmount,
    backgroundColor,
    onSanitizedAmountChange,
    inputError,
    label,
    autoFocus
  }: CustomGasPriceInputProps) => {
    const [draftAmount, setDraftAmount] = useState(initialAmount)

    useEffect(() => {
      setDraftAmount(initialAmount)
    }, [initialAmount])

    const onChange = useCallback(
      (text: string) => {
        setDraftAmount(text)
        onSanitizedAmountChange(text.replace(',', '.'))
      },
      [onSanitizedAmountChange]
    )

    const onBlur = useCallback(() => {
      const sanitized = draftAmount.trim().replace(',', '.')
      setDraftAmount(sanitized)
      onSanitizedAmountChange(sanitized)
    }, [draftAmount, onSanitizedAmountChange])

    return (
      <NumberInput
        label={label}
        placeholder="0"
        value={draftAmount}
        onChangeText={onChange}
        onBlur={onBlur}
        precision={9}
        error={inputError}
        autoFocus={autoFocus}
        backgroundColor={backgroundColor}
      />
    )
  }
)

type Props = {
  backgroundColor: ColorValue
  closeBottomSheet: () => void
  currentMaxFeePerGas: string
  currentMaxPriorityFeePerGas: string
  is1559?: boolean
  onSaveCustomGasPrices: (gasPrices: GasSpeeds) => void
  selectedOption: ISignAccountOpController['selectedOption']
  sheetRef: React.RefObject<Modalize>
}

const CustomGasPrice = ({
  backgroundColor,
  closeBottomSheet,
  currentMaxFeePerGas,
  currentMaxPriorityFeePerGas,
  is1559,
  onSaveCustomGasPrices,
  selectedOption,
  sheetRef
}: Props) => {
  const { t } = useTranslation()
  const [customGasPriceError, setCustomGasPriceError] = useState<string | boolean>(false)
  const maxFeePerGasRef = useRef('')
  const maxPriorityFeePerGasRef = useRef('')
  const [initialMaxFeePerGas, setInitialMaxFeePerGas] = useState('')
  const [initialMaxPriorityFeePerGas, setInitialMaxPriorityFeePerGas] = useState('')

  const resetState = useCallback(() => {
    maxFeePerGasRef.current = currentMaxFeePerGas
    maxPriorityFeePerGasRef.current = currentMaxPriorityFeePerGas
    setInitialMaxFeePerGas(currentMaxFeePerGas)
    setInitialMaxPriorityFeePerGas(currentMaxPriorityFeePerGas)
    setCustomGasPriceError(false)
  }, [currentMaxFeePerGas, currentMaxPriorityFeePerGas])

  const onMaxFeePerGasChange = useCallback(
    (value: string) => {
      maxFeePerGasRef.current = value
      if (customGasPriceError) setCustomGasPriceError(false)
    },
    [customGasPriceError]
  )

  const onMaxPriorityFeePerGasChange = useCallback(
    (value: string) => {
      maxPriorityFeePerGasRef.current = value
      if (customGasPriceError) setCustomGasPriceError(false)
    },
    [customGasPriceError]
  )

  const saveCustomGasPrice = useCallback(() => {
    if (!selectedOption) return

    const normalizedMaxFeePerGas = maxFeePerGasRef.current.trim().replace(',', '.')
    const normalizedMaxPriorityFeePerGas = maxPriorityFeePerGasRef.current.trim().replace(',', '.')

    if (!normalizedMaxFeePerGas || (is1559 && !normalizedMaxPriorityFeePerGas)) {
      setCustomGasPriceError(t('Enter valid gas prices'))
      return
    }

    try {
      const maxFeePerGas = parseUnits(normalizedMaxFeePerGas, 'gwei')
      const maxPriorityFeePerGas = is1559 ? parseUnits(normalizedMaxPriorityFeePerGas, 'gwei') : 0n

      if (maxFeePerGas <= 0n || (is1559 && maxPriorityFeePerGas <= 0n)) {
        setCustomGasPriceError(t('Enter valid gas prices'))
        return
      }

      const maxFeePerGasHex = toBeHex(maxFeePerGas) as Hex
      const maxPriorityFeePerGasHex = toBeHex(maxPriorityFeePerGas) as Hex
      const customGasPrices: GasSpeeds = {
        slow: {
          maxFeePerGas: maxFeePerGasHex,
          maxPriorityFeePerGas: maxPriorityFeePerGasHex
        },
        medium: {
          maxFeePerGas: maxFeePerGasHex,
          maxPriorityFeePerGas: maxPriorityFeePerGasHex
        },
        fast: {
          maxFeePerGas: maxFeePerGasHex,
          maxPriorityFeePerGas: maxPriorityFeePerGasHex
        },
        ape: {
          maxFeePerGas: maxFeePerGasHex,
          maxPriorityFeePerGas: maxPriorityFeePerGasHex
        }
      }

      onSaveCustomGasPrices(customGasPrices)
      closeBottomSheet()
    } catch {
      setCustomGasPriceError(t('Enter valid gas prices'))
    }
  }, [closeBottomSheet, is1559, onSaveCustomGasPrices, selectedOption, t])

  return (
    <BottomSheet
      id="custom-gas-price-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      type="modal"
      animationDuration={0}
      onOpen={resetState}
    >
      <ModalHeader title={t('Advanced options')} handleClose={closeBottomSheet} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <CustomGasPriceInput
            initialAmount={initialMaxFeePerGas}
            backgroundColor={backgroundColor}
            onSanitizedAmountChange={onMaxFeePerGasChange}
            inputError={customGasPriceError}
            label={t('Max fee per gas (GWEI)')}
            autoFocus
          />
        </View>
        {!!is1559 && (
          <View style={{ flex: 1 }}>
            <CustomGasPriceInput
              initialAmount={initialMaxPriorityFeePerGas}
              backgroundColor={backgroundColor}
              onSanitizedAmountChange={onMaxPriorityFeePerGasChange}
              inputError={customGasPriceError}
              label={t('Max priority fee (GWEI)')}
            />
          </View>
        )}
      </View>
      <FooterGlassView absolute={false} isSimpleBlur={false} size="sm" style={spacings.mtLg}>
        <Button
          type="secondary"
          text={t('Cancel')}
          onPress={closeBottomSheet}
          hasBottomSpacing={false}
          style={{ flex: 1, width: 100, ...spacings.mrSm }}
          size="smaller"
        />
        <Button
          type="primary"
          text={t('Save')}
          onPress={saveCustomGasPrice}
          hasBottomSpacing={false}
          style={{ flex: 1, width: 100 }}
          size="smaller"
        />
      </FooterGlassView>
    </BottomSheet>
  )
}

export default memo(CustomGasPrice)
