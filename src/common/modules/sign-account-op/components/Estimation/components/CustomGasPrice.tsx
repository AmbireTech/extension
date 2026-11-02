import { formatUnits, toBeHex, ZeroAddress } from 'ethers'
import { memo, RefObject, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { Hex } from '@ambire-common/interfaces/hex'
import { ISignAccountOpController, SpeedCalc } from '@ambire-common/interfaces/signAccountOp'
import { GasSpeeds } from '@ambire-common/services/bundlers/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { safeTokenAmountAndNumberMultiplication } from '@ambire-common/utils/numbers/formatters'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'

import {
  CustomGasPriceErrorReason,
  CustomGasPriceWarningReason,
  getCustomGasPriceWarnings,
  GWEI_DECIMALS,
  normalizeCustomGasValue,
  validateCustomGasPrice
} from './customGasPriceValidation'

type CustomGasPriceInputProps = {
  initialAmount: string
  backgroundColor: ColorValue
  onSanitizedAmountChange: (value: string) => void
  inputError: string | boolean
  /** Shown only when there is no error, as the value can still be saved */
  inputWarning?: string
  label: string
  /** Explains the field in plain words, next to the label */
  tooltip?: { id: string; content: string }
  unitLabel?: string
  autoFocus?: boolean
  disabled?: boolean
  disabledReason?: string
  /** Blocks typing more decimals than this. When not set, any number of decimals can be typed */
  precision?: number
}

const CustomGasPriceInput = memo(
  ({
    initialAmount,
    backgroundColor,
    onSanitizedAmountChange,
    inputError,
    inputWarning,
    label,
    tooltip,
    unitLabel,
    autoFocus,
    disabled,
    disabledReason,
    precision
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
        tooltip={tooltip}
        placeholder="0"
        value={draftAmount}
        onChangeText={onChange}
        onBlur={onBlur}
        precision={precision}
        error={!disabled && (inputError || inputWarning)}
        errorType={inputError ? 'error' : 'warning'}
        info={disabled ? disabledReason : undefined}
        autoFocus={autoFocus}
        backgroundColor={backgroundColor}
        disabled={disabled}
        // A unit, not a button, so it is not pressable
        childrenBeforeButtons={
          !!unitLabel && (
            <View
              style={[
                spacings.phTy,
                spacings.mvTy,
                spacings.mrTy,
                flexbox.justifyCenter,
                { borderRadius: 8, backgroundColor: theme.tertiaryBackground }
              ]}
            >
              <Text weight="medium">{unitLabel}</Text>
            </View>
          )
        }
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
      />
    )
  }
)

type Props = {
  backgroundColor: ColorValue
  closeBottomSheet: () => void
  canSetCustomGas: boolean
  /** Why the fee can't be set manually. Shown instead of the fields */
  unavailableReason?: { title: string; text: string }
  currentGas: string
  currentMaxFeePerGas: string
  currentMaxPriorityFeePerGas: string
  is1559?: boolean
  onSaveCustomGasPrices: (gasPrices: GasSpeeds, customGasLimit?: bigint) => void
  selectedOption: ISignAccountOpController['selectedOption']
  sheetRef: RefObject<Modalize>
  /** When speeding up a transaction, the lowest fees (in wei) the network accepts as a replacement */
  speedUpMinFees?: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
  /** The pending transaction is being canceled rather than sped up */
  isCancel?: boolean
  /** The fee speeds at the network gas prices, to warn about custom values that are too low or too high */
  networkSpeeds: SpeedCalc[]
  hasCustomGasPrices: boolean
  /** Drops the custom gas values and goes back to the network fee */
  onResetCustomGas: () => void
}

const CustomGasPrice = ({
  closeBottomSheet,
  canSetCustomGas,
  unavailableReason,
  currentGas,
  currentMaxFeePerGas,
  currentMaxPriorityFeePerGas,
  is1559,
  onSaveCustomGasPrices,
  selectedOption,
  sheetRef,
  speedUpMinFees,
  isCancel,
  networkSpeeds,
  hasCustomGasPrices,
  onResetCustomGas
}: Props) => {
  const { t } = useTranslation()
  const { isNarrowWebLayout, isCompactLayout } = useCompactLayout()
  const { theme } = useTheme()
  const [gas, setGas] = useState('')
  const [maxFeePerGas, setMaxFeePerGas] = useState('')
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState('')
  const [initialGas, setInitialGas] = useState('')
  const [initialMaxFeePerGas, setInitialMaxFeePerGas] = useState('')
  const [initialMaxPriorityFeePerGas, setInitialMaxPriorityFeePerGas] = useState('')
  const { isPopup } = getUiType()

  const resetState = useCallback(() => {
    setGas(currentGas)
    setMaxFeePerGas(currentMaxFeePerGas)
    setMaxPriorityFeePerGas(currentMaxPriorityFeePerGas)
    setInitialGas(currentGas)
    setInitialMaxFeePerGas(currentMaxFeePerGas)
    setInitialMaxPriorityFeePerGas(currentMaxPriorityFeePerGas)
  }, [currentGas, currentMaxFeePerGas, currentMaxPriorityFeePerGas])

  // Validated on every change, so the user sees what is wrong while typing and cannot save it
  const { errors: customGasPriceErrors, values: customGasPriceValues } = useMemo(
    () =>
      validateCustomGasPrice({
        maxFeePerGas,
        maxPriorityFeePerGas,
        gas,
        is1559: !!is1559,
        canSetCustomGas,
        speedUpMinFees
      }),
    [canSetCustomGas, gas, is1559, maxFeePerGas, maxPriorityFeePerGas, speedUpMinFees]
  )

  const customGasPriceErrorMessages = useMemo(() => {
    const getFeeErrorMessage = (
      reason: CustomGasPriceErrorReason | undefined,
      invalidMessage: string,
      speedUpMinFee?: bigint
    ) => {
      if (reason === 'tooManyDecimals') {
        return t('Use up to {{decimals}} digits after the decimal point', {
          decimals: GWEI_DECIMALS
        })
      }
      if (reason === 'aboveMaxFee') {
        return t('The max priority fee cannot be higher than the max fee')
      }
      if (reason === 'belowSpeedUpMinimum' && speedUpMinFee !== undefined) {
        const minFee = formatUnits(speedUpMinFee, 'gwei')

        return isCancel
          ? t('To cancel your transaction, enter at least {{minFee}} GWEI', { minFee })
          : t('To speed up your transaction, enter at least {{minFee}} GWEI', { minFee })
      }
      if (reason === 'invalid') return invalidMessage

      return false
    }

    return {
      maxFeePerGas: getFeeErrorMessage(
        customGasPriceErrors.maxFeePerGas,
        t('Enter a max fee greater than 0'),
        speedUpMinFees?.maxFeePerGas
      ),
      maxPriorityFeePerGas: getFeeErrorMessage(
        customGasPriceErrors.maxPriorityFeePerGas,
        t('Enter a max priority fee greater than 0'),
        speedUpMinFees?.maxPriorityFeePerGas
      ),
      gas:
        !!customGasPriceErrors.gas && t('Enter a gas limit that is a whole number greater than 0')
    }
  }, [customGasPriceErrors, speedUpMinFees, isCancel, t])

  const customGasPriceWarningMessages = useMemo(() => {
    const warnings = customGasPriceValues
      ? getCustomGasPriceWarnings({
          values: customGasPriceValues,
          networkSpeeds,
          is1559: !!is1559
        })
      : {}

    const getWarningMessage = (reason: CustomGasPriceWarningReason | undefined) => {
      if (reason === 'belowSlowest') {
        return t(
          'This is lower than the network needs right now. Your transaction can stay pending for a long time or never go through.'
        )
      }
      if (reason === 'farAboveFastest') {
        return t('This is much higher than the fastest option. You may pay more than you need to.')
      }
      if (reason === 'belowEstimatedGas') {
        return t(
          'This is lower than the estimated {{estimatedGas}}. Your transaction can fail, and you still pay the fee.',
          { estimatedGas: networkSpeeds[0]?.simulatedGasLimit.toString() }
        )
      }

      return undefined
    }

    return {
      maxFeePerGas: getWarningMessage(warnings.maxFeePerGas),
      maxPriorityFeePerGas: getWarningMessage(warnings.maxPriorityFeePerGas),
      gas: getWarningMessage(warnings.gas)
    }
  }, [customGasPriceValues, is1559, networkSpeeds, t])

  // Shown only for the native token, as it is what the network fee is paid in
  const maxNetworkFeeText = useMemo(() => {
    const feeToken = selectedOption?.token
    if (!customGasPriceValues || !feeToken) return null
    if (feeToken.address !== ZeroAddress || feeToken.flags.onGasTank) return null

    const gasLimit = customGasPriceValues.gas ?? (currentGas ? BigInt(currentGas) : null)
    if (!gasLimit) return null

    const maxAmount = gasLimit * customGasPriceValues.maxFeePerGas + selectedOption.addedNative
    const maxAmountText = `${formatDecimals(
      Number(formatUnits(maxAmount, feeToken.decimals)),
      'precise'
    )} ${feeToken.symbol}`
    const usdPrice = feeToken.priceIn.find(({ baseCurrency }) => baseCurrency === 'usd')?.price

    if (!usdPrice) return t('Network fee: up to {{amount}}', { amount: maxAmountText })

    return t('Network fee: up to {{amount}} ({{amountUsd}})', {
      amount: maxAmountText,
      amountUsd: formatDecimals(
        Number(safeTokenAmountAndNumberMultiplication(maxAmount, feeToken.decimals, usdPrice)),
        'value'
      )
    })
  }, [currentGas, customGasPriceValues, selectedOption, t])

  const resetCustomGas = useCallback(() => {
    onResetCustomGas()
    closeBottomSheet()
  }, [closeBottomSheet, onResetCustomGas])

  const saveCustomGasPrice = useCallback(() => {
    if (!selectedOption || !customGasPriceValues) return

    const maxFeePerGasHex = toBeHex(customGasPriceValues.maxFeePerGas) as Hex
    const maxPriorityFeePerGasHex = toBeHex(customGasPriceValues.maxPriorityFeePerGas) as Hex
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
      canSetCustomGas && normalizeCustomGasValue(gas) !== currentGas
        ? customGasPriceValues.gas
        : undefined
    )
    closeBottomSheet()
  }, [
    canSetCustomGas,
    closeBottomSheet,
    currentGas,
    customGasPriceValues,
    gas,
    onSaveCustomGasPrices,
    selectedOption
  ])

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
      style={{ ...spacings.pbLg, ...(isNarrowWebLayout ? { width: '100%' } : null) }}
    >
      {isMobile ? (
        <>
          <ModalHeader
            title={t('Advanced options')}
            style={unavailableReason ? spacings.mbLg : spacings.mbTy}
          />
          {!unavailableReason && (
            <Text
              fontSize={14}
              appearance="secondaryText"
              style={[spacings.mbLg, textStyles.center]}
            >
              {t('Set gas values manually')}
            </Text>
          )}
        </>
      ) : (
        <View style={[flexbox.directionRow, flexbox.alignStart, spacings.mbLg]}>
          <Header.BackButton onGoBackPress={closeBottomSheet} forceBack displayIn="always" />
          <View style={spacings.mlTy}>
            <Text weight="medium" fontSize={20}>
              {t('Advanced options')}
            </Text>
            {!unavailableReason && (
              <Text fontSize={14} appearance="secondaryText" style={spacings.mtTy}>
                {t('Set gas values manually')}
              </Text>
            )}
          </View>
        </View>
      )}
      {unavailableReason ? (
        <Alert
          type="info"
          size="sm"
          title={unavailableReason.title}
          text={unavailableReason.text}
        />
      ) : (
        <View>
          <CustomGasPriceInput
            initialAmount={initialMaxFeePerGas}
            backgroundColor={theme.secondaryBackground}
            onSanitizedAmountChange={setMaxFeePerGas}
            inputError={customGasPriceErrorMessages.maxFeePerGas}
            inputWarning={customGasPriceWarningMessages.maxFeePerGas}
            label={t('Max fee per gas')}
            tooltip={{
              id: 'custom-gas-max-fee-tooltip',
              content: is1559
                ? t(
                    'The most you agree to pay for each unit of work the network does for your transaction. You usually pay less, as only what the network needs is charged.'
                  )
                : t(
                    'The price you pay for each unit of work the network does for your transaction.'
                  )
            }}
            unitLabel="GWEI"
            autoFocus
          />
          {!!is1559 && (
            <CustomGasPriceInput
              initialAmount={initialMaxPriorityFeePerGas}
              backgroundColor={theme.secondaryBackground}
              onSanitizedAmountChange={setMaxPriorityFeePerGas}
              inputError={customGasPriceErrorMessages.maxPriorityFeePerGas}
              inputWarning={customGasPriceWarningMessages.maxPriorityFeePerGas}
              label={t('Max priority fee')}
              tooltip={{
                id: 'custom-gas-max-priority-fee-tooltip',
                content: t(
                  'An extra payment so the network includes your transaction sooner. You pay it in full.'
                )
              }}
              unitLabel="GWEI"
            />
          )}

          <CustomGasPriceInput
            initialAmount={initialGas}
            backgroundColor={theme.secondaryBackground}
            onSanitizedAmountChange={setGas}
            inputError={customGasPriceErrorMessages.gas}
            inputWarning={customGasPriceWarningMessages.gas}
            label={t('Gas limit')}
            tooltip={{
              id: 'custom-gas-limit-tooltip',
              content: t(
                'The most work your transaction is allowed to use. If it needs more, it fails and you still pay the fee.'
              )
            }}
            precision={0}
            disabled={!canSetCustomGas}
            disabledReason={t('Custom gas cannot be set for an EOA batch')}
          />
          {!!maxNetworkFeeText && (
            <Text fontSize={14} appearance="secondaryText" testID="custom-gas-max-network-fee">
              {maxNetworkFeeText}
            </Text>
          )}
        </View>
      )}
      {/* Nothing to save when the fee can't be set. The sheet closes on drag, backdrop or back arrow */}
      {!unavailableReason && (
        <FooterGlassView
          absolute={false}
          isSimpleBlur={isNarrowWebLayout}
          size="sm"
          style={spacings.mt}
          mobileStyle={{ ...flexbox.directionRow, ...spacings.mtXl }}
          innerContainerStyle={isNarrowWebLayout ? { width: '100%' } : undefined}
        >
          {/* Takes the place of Cancel on mobile, where the sheet also closes on drag and backdrop */}
          {hasCustomGasPrices && (
            <Button
              type="secondary"
              text={t('Reset')}
              onPress={resetCustomGas}
              hasBottomSpacing={false}
              style={[
                spacings.mrTy,
                isCompactLayout || isNarrowWebLayout ? flexbox.flex1 : { width: 100 }
              ]}
              size={isNarrowWebLayout ? 'regular' : 'smaller'}
              testID="reset-custom-gas-button"
            />
          )}
          {/* On web the header's back arrow already closes the sheet */}
          {isMobile && !hasCustomGasPrices && (
            <Button
              type="secondary"
              text={t('Cancel')}
              onPress={closeBottomSheet}
              hasBottomSpacing={false}
              style={[spacings.mrTy, flexbox.flex1]}
              size="smaller"
            />
          )}
          <Button
            type="primary"
            text={t('Save')}
            onPress={saveCustomGasPrice}
            disabled={!customGasPriceValues}
            hasBottomSpacing={false}
            style={
              isNarrowWebLayout && !hasCustomGasPrices
                ? { width: '100%' }
                : isCompactLayout || isNarrowWebLayout
                  ? flexbox.flex1
                  : { width: 100 }
            }
            size={isNarrowWebLayout ? 'regular' : 'smaller'}
          />
        </FooterGlassView>
      )}
    </BottomSheet>
  )
}

export default memo(CustomGasPrice)
