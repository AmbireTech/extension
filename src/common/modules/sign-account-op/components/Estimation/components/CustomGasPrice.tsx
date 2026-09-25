import { toBeHex } from 'ethers'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType/uiType'

import {
  CustomGasPriceErrors,
  normalizeCustomGasValue,
  validateCustomGasPrice
} from './customGasPriceValidation'

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
  const { isNarrowSidePanel, isCompactLayout } = useCompactActionRequestLayout()
  const { theme } = useTheme()
  const [customGasPriceErrors, setCustomGasPriceErrors] = useState<CustomGasPriceErrors>({})
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
    setCustomGasPriceErrors({})
  }, [currentGas, currentMaxFeePerGas, currentMaxPriorityFeePerGas])

  const onGasChange = useCallback((value: string) => {
    gasRef.current = value
    setCustomGasPriceErrors((prevErrors) =>
      prevErrors.gas ? { ...prevErrors, gas: undefined } : prevErrors
    )
  }, [])

  const onMaxFeePerGasChange = useCallback((value: string) => {
    maxFeePerGasRef.current = value
    setCustomGasPriceErrors((prevErrors) => {
      // The priority fee is compared with the max fee, so a new max fee can also fix that error
      const isPriorityFeeAboveMaxFee = prevErrors.maxPriorityFeePerGas === 'aboveMaxFee'
      if (!prevErrors.maxFeePerGas && !isPriorityFeeAboveMaxFee) return prevErrors

      return {
        ...prevErrors,
        maxFeePerGas: undefined,
        ...(isPriorityFeeAboveMaxFee && { maxPriorityFeePerGas: undefined })
      }
    })
  }, [])

  const onMaxPriorityFeePerGasChange = useCallback((value: string) => {
    maxPriorityFeePerGasRef.current = value
    setCustomGasPriceErrors((prevErrors) =>
      prevErrors.maxPriorityFeePerGas
        ? { ...prevErrors, maxPriorityFeePerGas: undefined }
        : prevErrors
    )
  }, [])

  const customGasPriceErrorMessages = useMemo(
    () => ({
      maxFeePerGas: !!customGasPriceErrors.maxFeePerGas && t('Enter a max fee greater than 0'),
      maxPriorityFeePerGas:
        (customGasPriceErrors.maxPriorityFeePerGas === 'aboveMaxFee' &&
          t('The max priority fee cannot be higher than the max fee')) ||
        (customGasPriceErrors.maxPriorityFeePerGas === 'invalid' &&
          t('Enter a max priority fee greater than 0')),
      gas:
        !!customGasPriceErrors.gas && t('Enter a gas limit that is a whole number greater than 0')
    }),
    [customGasPriceErrors, t]
  )

  const saveCustomGasPrice = useCallback(() => {
    if (!selectedOption) return

    const { errors, values } = validateCustomGasPrice({
      maxFeePerGas: maxFeePerGasRef.current,
      maxPriorityFeePerGas: maxPriorityFeePerGasRef.current,
      gas: gasRef.current,
      is1559: !!is1559,
      canSetCustomGas
    })

    if (!values) {
      setCustomGasPriceErrors(errors)
      return
    }

    const maxFeePerGasHex = toBeHex(values.maxFeePerGas) as Hex
    const maxPriorityFeePerGasHex = toBeHex(values.maxPriorityFeePerGas) as Hex
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
      canSetCustomGas && normalizeCustomGasValue(gasRef.current) !== currentGas
        ? values.gas
        : undefined
    )
    closeBottomSheet()
  }, [canSetCustomGas, closeBottomSheet, currentGas, is1559, onSaveCustomGasPrices, selectedOption])

  return (
    <BottomSheet
      id="custom-gas-price-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      // Compact = mobile / narrow side panel; popup also needs a sheet (v2).
      type={isCompactLayout || isPopup ? 'bottom-sheet' : 'modal'}
      animationDuration={0}
      onOpen={resetState}
      shouldBeClosableOnDrag={isMobile}
      backgroundColor="primaryBackground"
      style={{ ...spacings.pbLg, ...(isNarrowSidePanel ? { width: '100%' } : null) }}
    >
      {isMobile ? (
        <>
          <ModalHeader title={t('Advanced options')} style={spacings.mbTy} />
          <Text fontSize={14} appearance="secondaryText" style={[spacings.mbLg, textStyles.center]}>
            {t('Set gas values manually')}
          </Text>
        </>
      ) : (
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
      )}
      <View>
        <CustomGasPriceInput
          initialAmount={initialMaxFeePerGas}
          backgroundColor={theme.secondaryBackground}
          onSanitizedAmountChange={onMaxFeePerGasChange}
          inputError={customGasPriceErrorMessages.maxFeePerGas}
          label={t('Max fee per gas')}
          unitLabel="GWEI"
          autoFocus
        />
        {!!is1559 && (
          <CustomGasPriceInput
            initialAmount={initialMaxPriorityFeePerGas}
            backgroundColor={theme.secondaryBackground}
            onSanitizedAmountChange={onMaxPriorityFeePerGasChange}
            inputError={customGasPriceErrorMessages.maxPriorityFeePerGas}
            label={t('Max priority fee')}
            unitLabel="GWEI"
          />
        )}

        <CustomGasPriceInput
          initialAmount={initialGas}
          backgroundColor={theme.secondaryBackground}
          onSanitizedAmountChange={onGasChange}
          inputError={customGasPriceErrorMessages.gas}
          label={t('Gas limit')}
          precision={0}
          disabled={!canSetCustomGas}
          disabledReason={t('Custom gas cannot be set for an EOA batch')}
        />
      </View>
      <FooterGlassView
        absolute={false}
        isSimpleBlur={isNarrowSidePanel}
        size="sm"
        style={spacings.mt}
        mobileStyle={{ ...flexbox.directionRow, ...spacings.mtXl }}
        innerContainerStyle={
          isNarrowSidePanel
            ? // The buttons stack here, and the primary one goes on top. Reversing the direction
              // keeps the same child order as the row layouts, where the primary one goes last
              { width: '100%', flexDirection: 'column-reverse' }
            : undefined
        }
      >
        <Button
          type="secondary"
          text={t('Cancel')}
          onPress={closeBottomSheet}
          hasBottomSpacing={false}
          style={[
            // Stacked buttons are spaced by the footer's gap, and a right margin would make this
            // one narrower than the primary button
            !isNarrowSidePanel && spacings.mrTy,
            isCompactLayout ? flexbox.flex1 : { width: 100 }
          ]}
          size="smaller"
        />
        <Button
          type="primary"
          text={t('Save')}
          onPress={saveCustomGasPrice}
          hasBottomSpacing={false}
          style={isCompactLayout ? flexbox.flex1 : { width: 100 }}
          size="smaller"
        />
      </FooterGlassView>
    </BottomSheet>
  )
}

export default memo(CustomGasPrice)
