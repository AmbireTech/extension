import { parseUnits, toBeHex } from 'ethers'
import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { Hex } from '@ambire-common/interfaces/hex'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { GasSpeeds } from '@ambire-common/services/bundlers/types'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType/uiType'

type CustomGasPriceInputProps = {
  initialAmount: string
  backgroundColor: ColorValue
  onSanitizedAmountChange: (value: string) => void
  inputError: string | boolean
  label: string
  unitLabel?: string
  autoFocus?: boolean
  disabled?: boolean
  disabledReason?: string
  precision?: number
}

const CustomGasPriceInput = memo(
  ({
    initialAmount,
    backgroundColor,
    onSanitizedAmountChange,
    inputError,
    label,
    unitLabel,
    autoFocus,
    disabled,
    disabledReason,
    precision = 9
  }: CustomGasPriceInputProps) => {
    const { theme } = useTheme()
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
        precision={precision}
        error={!disabled && inputError}
        info={disabled ? disabledReason : undefined}
        autoFocus={autoFocus}
        backgroundColor={backgroundColor}
        disabled={disabled}
        button={unitLabel}
        buttonProps={{ withBackground: true }}
        containerStyle={spacings.mbLg}
        inputWrapperStyle={[
          common.borderRadiusPrimary,
          {
            minHeight: 48,
            borderWidth: 0
          }
        ]}
        inputStyle={{ flex: 1, height: 46, ...spacings.phSm }}
        nativeInputStyle={{
          fontSize: 16,
          color: theme.primaryText
        }}
        buttonStyle={{
          borderRadius: 8,
          backgroundColor: theme.tertiaryBackground,
          ...spacings.phTy,
          ...spacings.mvTy
        }}
      />
    )
  }
)

type Props = {
  backgroundColor: ColorValue
  closeBottomSheet: () => void
  canSetCustomGas: boolean
  currentGas: string
  currentMaxFeePerGas: string
  currentMaxPriorityFeePerGas: string
  is1559?: boolean
  onSaveCustomGasPrices: (gasPrices: GasSpeeds, customGasLimit?: bigint) => void
  selectedOption: ISignAccountOpController['selectedOption']
  sheetRef: React.RefObject<Modalize>
}

const CustomGasPrice = ({
  backgroundColor,
  closeBottomSheet,
  canSetCustomGas,
  currentGas,
  currentMaxFeePerGas,
  currentMaxPriorityFeePerGas,
  is1559,
  onSaveCustomGasPrices,
  selectedOption,
  sheetRef
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [customGasPriceError, setCustomGasPriceError] = useState<string | boolean>(false)
  const gasRef = useRef('')
  const maxFeePerGasRef = useRef('')
  const maxPriorityFeePerGasRef = useRef('')
  const [initialGas, setInitialGas] = useState('')
  const [initialMaxFeePerGas, setInitialMaxFeePerGas] = useState('')
  const [initialMaxPriorityFeePerGas, setInitialMaxPriorityFeePerGas] = useState('')
  const { isPopup } = getUiType()

  const resetState = useCallback(() => {
    gasRef.current = currentGas
    maxFeePerGasRef.current = currentMaxFeePerGas
    maxPriorityFeePerGasRef.current = currentMaxPriorityFeePerGas
    setInitialGas(currentGas)
    setInitialMaxFeePerGas(currentMaxFeePerGas)
    setInitialMaxPriorityFeePerGas(currentMaxPriorityFeePerGas)
    setCustomGasPriceError(false)
  }, [currentGas, currentMaxFeePerGas, currentMaxPriorityFeePerGas])

  const onGasChange = useCallback(
    (value: string) => {
      gasRef.current = value
      if (customGasPriceError) setCustomGasPriceError(false)
    },
    [customGasPriceError]
  )

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
    const normalizedGas = gasRef.current.trim().replace(',', '.')

    if (
      !normalizedMaxFeePerGas ||
      (is1559 && !normalizedMaxPriorityFeePerGas) ||
      (canSetCustomGas && !normalizedGas)
    ) {
      setCustomGasPriceError(t('Enter valid gas prices'))
      return
    }

    try {
      const maxFeePerGas = parseUnits(normalizedMaxFeePerGas, 'gwei')
      const maxPriorityFeePerGas = is1559 ? parseUnits(normalizedMaxPriorityFeePerGas, 'gwei') : 0n
      const gas = canSetCustomGas ? BigInt(normalizedGas) : undefined

      if (
        maxFeePerGas <= 0n ||
        (is1559 && maxPriorityFeePerGas <= 0n) ||
        (typeof gas !== 'undefined' && gas <= 0n)
      ) {
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

      onSaveCustomGasPrices(
        customGasPrices,
        canSetCustomGas && normalizedGas !== currentGas ? gas : undefined
      )
      closeBottomSheet()
    } catch {
      setCustomGasPriceError(t('Enter valid gas prices'))
    }
  }, [
    canSetCustomGas,
    closeBottomSheet,
    currentGas,
    is1559,
    onSaveCustomGasPrices,
    selectedOption,
    t
  ])

  return (
    <BottomSheet
      id="custom-gas-price-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      type={isMobile || isPopup ? 'bottom-sheet' : 'modal'}
      animationDuration={0}
      onOpen={resetState}
      shouldBeClosableOnDrag={isMobile}
      backgroundColor="primaryBackground"
      style={spacings.pbLg}
    >
      <View style={[flexbox.directionRow, flexbox.alignStart, spacings.mbLg]}>
        <Header.BackButton onGoBackPress={closeBottomSheet} forceBack displayIn="always" />
        <View style={spacings.mlTy}>
          <Text weight="medium" fontSize={20}>
            {t('Advanced options')}
          </Text>
          <Text fontSize={14} appearance="secondaryText" style={spacings.mtTy}>
            {t('Set gas values manually')}
          </Text>
        </View>
      </View>
      <View>
        <CustomGasPriceInput
          initialAmount={initialMaxFeePerGas}
          backgroundColor={theme.secondaryBackground}
          onSanitizedAmountChange={onMaxFeePerGasChange}
          inputError={customGasPriceError}
          label={t('Max fee per gas')}
          unitLabel="GWEI"
          autoFocus
        />
        {!!is1559 && (
          <CustomGasPriceInput
            initialAmount={initialMaxPriorityFeePerGas}
            backgroundColor={theme.secondaryBackground}
            onSanitizedAmountChange={onMaxPriorityFeePerGasChange}
            inputError={customGasPriceError}
            label={t('Max priority fee')}
            unitLabel="GWEI"
          />
        )}

        <CustomGasPriceInput
          initialAmount={initialGas}
          backgroundColor={theme.secondaryBackground}
          onSanitizedAmountChange={onGasChange}
          inputError={customGasPriceError}
          label={t('Gas limit')}
          precision={0}
          disabled={!canSetCustomGas}
          disabledReason={t('Custom gas cannot be set for an EOA batch')}
        />
      </View>
      <FooterGlassView
        absolute={false}
        isSimpleBlur={false}
        size="sm"
        style={spacings.mt}
        mobileStyle={{ ...flexbox.directionRow, ...spacings.mtXl }}
      >
        <Button
          type="secondary"
          text={t('Cancel')}
          onPress={closeBottomSheet}
          hasBottomSpacing={false}
          style={[spacings.mrTy, isWeb && { width: 100 }, isMobile && flexbox.flex1]}
          size="smaller"
        />
        <Button
          type="primary"
          text={t('Save')}
          onPress={saveCustomGasPrice}
          hasBottomSpacing={false}
          style={[isWeb && { width: 100 }, isMobile && flexbox.flex1]}
          size="smaller"
        />
      </FooterGlassView>
    </BottomSheet>
  )
}

export default memo(CustomGasPrice)
