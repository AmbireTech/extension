import { formatUnits, parseUnits, toBeHex } from 'ethers'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue } from 'react-native'
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
  decimals?: number
  symbol?: string
}

const CustomGasPriceInput = memo(
  ({
    initialAmount,
    backgroundColor,
    onSanitizedAmountChange,
    inputError,
    decimals,
    symbol
  }: CustomGasPriceInputProps) => {
    const { t } = useTranslation()
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
        label={t('Gas price ({{symbol}})', { symbol })}
        placeholder={t('Enter gas price')}
        value={draftAmount}
        onChangeText={onChange}
        onBlur={onBlur}
        precision={decimals || 18}
        error={inputError}
        info={t('Set the gas price in the chain native token per gas unit.')}
        autoFocus
        backgroundColor={backgroundColor}
      />
    )
  }
)

type Props = {
  backgroundColor: ColorValue
  closeBottomSheet: () => void
  currentGasPrice: string
  onSaveCustomGasPrices: (gasPrices: GasSpeeds) => void
  selectedOption: ISignAccountOpController['selectedOption']
  sheetRef: React.RefObject<Modalize>
  symbol?: string
}

const CustomGasPrice = ({
  backgroundColor,
  closeBottomSheet,
  currentGasPrice,
  onSaveCustomGasPrices,
  selectedOption,
  sheetRef,
  symbol
}: Props) => {
  const { t } = useTranslation()
  const [customGasPriceError, setCustomGasPriceError] = useState<string | boolean>(false)
  const customGasPriceRef = useRef('')
  const [initialCustomGasPrice, setInitialCustomGasPrice] = useState('')

  const resetState = useCallback(() => {
    customGasPriceRef.current = currentGasPrice
    setInitialCustomGasPrice(currentGasPrice)
    setCustomGasPriceError(false)
  }, [currentGasPrice])

  const onCustomGasPriceChange = useCallback(
    (value: string) => {
      customGasPriceRef.current = value
      if (customGasPriceError) setCustomGasPriceError(false)
    },
    [customGasPriceError]
  )

  const saveCustomGasPrice = useCallback(() => {
    if (!selectedOption) return

    const normalizedValue = customGasPriceRef.current.trim().replace(',', '.')

    if (!normalizedValue) {
      setCustomGasPriceError(t('Enter a gas price'))
      return
    }

    try {
      const gasPrice = parseUnits(normalizedValue, selectedOption.token.decimals || 18)

      if (gasPrice <= 0n) {
        setCustomGasPriceError(t('Enter a valid gas price'))
        return
      }

      const gasPriceHex = toBeHex(gasPrice) as Hex
      const customGasPrices: GasSpeeds = {
        slow: {
          maxFeePerGas: gasPriceHex,
          maxPriorityFeePerGas: gasPriceHex
        },
        medium: {
          maxFeePerGas: gasPriceHex,
          maxPriorityFeePerGas: gasPriceHex
        },
        fast: {
          maxFeePerGas: gasPriceHex,
          maxPriorityFeePerGas: gasPriceHex
        },
        ape: {
          maxFeePerGas: gasPriceHex,
          maxPriorityFeePerGas: gasPriceHex
        }
      }

      onSaveCustomGasPrices(customGasPrices)
      closeBottomSheet()
    } catch {
      setCustomGasPriceError(t('Enter a valid gas price'))
    }
  }, [closeBottomSheet, onSaveCustomGasPrices, selectedOption, t])

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
      <CustomGasPriceInput
        initialAmount={initialCustomGasPrice}
        backgroundColor={backgroundColor}
        onSanitizedAmountChange={onCustomGasPriceChange}
        inputError={customGasPriceError}
        decimals={selectedOption?.token.decimals}
        symbol={symbol}
      />
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
