import { parseUnits } from 'ethers'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import {
  convertTokenPriceToBigInt,
  textToValidDecimal
} from '@ambire-common/utils/numbers/formatters'
import InfoIcon from '@common/assets/svg/InfoIcon'
import TokenAndAmountSelector from '@common/components/TokenAndAmountSelector'
import Select, { SectionedSelect } from '@common/components/Select'
import { SectionedSelectProps, SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getSliderAmountFieldValue } from '@common/utils/amountSlider'

import type { AmountAdjustmentInfo } from '@ambire-common/interfaces/transfer'
import type { TokenResult } from '@ambire-common/libs/portfolio'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const SECTION_MENU_HEADER_HEIGHT = 50
const FIAT_DECIMALS = 2

/** The amount field holds whatever was typed into it, so it can carry more decimals than the unit
 * it is in allows. `parseUnits` rejects those outright, and the slider is better off sitting at the
 * truncated amount than snapping back to zero mid-typing. */
const toAmountWei = (value: string, decimals: number) => {
  const [whole, fraction] = (value || '0').split('.')
  const fractionDigits = fraction ? fraction.slice(0, decimals) : ''
  const truncated = fractionDigits ? `${whole || '0'}.${fractionDigits}` : whole || '0'

  try {
    return parseUnits(truncated, decimals)
  } catch {
    return 0n
  }
}

/** The balance priced in USD, in `FIAT_DECIMALS` units. Uses the controllers' bigint math and
 * rounds down, so the slider's range never reaches past what the account can actually send. */
const toMaxFiatAmountWei = (maxAmount: string, decimals: number, tokenUsdPrice?: number) => {
  if (!tokenUsdPrice) return 0n

  const { tokenPriceBigInt, tokenPriceDecimals } = convertTokenPriceToBigInt(tokenUsdPrice)
  const fiatAmountWei = toAmountWei(maxAmount, decimals) * tokenPriceBigInt
  const excessDecimals = decimals + tokenPriceDecimals - FIAT_DECIMALS

  return excessDecimals >= 0
    ? fiatAmountWei / 10n ** BigInt(excessDecimals)
    : fiatAmountWei * 10n ** BigInt(-excessDecimals)
}

type Props = {
  label: string
  fromTokenOptions: SelectValue[]
  fromTokenValue?: SelectValue
  fromAmountValue: string
  fromTokenAmountSelectDisabled: boolean
  handleChangeFromToken: (value: SelectValue) => void
  fromSelectedToken: TokenResult | null
  fromAmount?: string
  fromAmountInFiat?: string
  fromAmountFieldMode: 'token' | 'fiat'
  maxFromAmount: string
  validateFromAmount: {
    message?: string
    success?: boolean
    severity?: 'error' | 'warning' | 'info' | 'success'
  }
  onFromAmountChange: (value: string) => void
  handleSwitchFromAmountFieldMode: () => void
  handleSetMaxFromAmount: () => void
  inputTestId?: string
  selectTestId?: string
  maxAmountDisabled?: boolean
  simulationFailed?: boolean
  amountAdjustmentInfo?: AmountAdjustmentInfo | null
  sections?: SectionedSelectProps['sections']
  renderSectionHeader?: SectionedSelectProps['renderSectionHeader']
  /** Extra styling for the amount slider's own row, e.g. to give it room before the panel ends. */
  sliderStyle?: ViewStyle
}

const selectPortfolio = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio

const SendToken: FC<Props> = ({
  label,
  fromTokenOptions,
  fromTokenValue,
  fromAmountValue,
  fromTokenAmountSelectDisabled,
  handleChangeFromToken,
  fromSelectedToken,
  fromAmount,
  fromAmountInFiat,
  fromAmountFieldMode,
  maxFromAmount,
  validateFromAmount,
  onFromAmountChange,
  handleSwitchFromAmountFieldMode,
  handleSetMaxFromAmount,
  inputTestId,
  selectTestId,
  maxAmountDisabled,
  simulationFailed,
  amountAdjustmentInfo,
  sections,
  renderSectionHeader,
  sliderStyle
}) => {
  const { state: portfolio } = useController('SelectedAccountController', selectPortfolio)
  const { theme } = useTheme()
  const { t } = useTranslation()

  const handleOnChangeTextAndFormat = useCallback(
    (text: string) => {
      let formatted = textToValidDecimal(text)

      if (formatted !== fromAmountValue) {
        onFromAmountChange(formatted)
      }
    },
    [fromAmountValue, onFromAmountChange]
  )

  const formattedAdjustedFeeAmount = useMemo(
    () =>
      amountAdjustmentInfo ? formatDecimals(Number(amountAdjustmentInfo.feeAmount), 'precise') : '',
    [amountAdjustmentInfo]
  )

  const nonEmptySections = sections?.filter((s) => s.data.length > 0)

  // The slider moves whichever amount the field is currently showing, so its axis is the token's
  // own balance in token mode and that same balance priced in USD in fiat mode.
  const sliderDecimals =
    fromAmountFieldMode === 'fiat' ? FIAT_DECIMALS : (fromSelectedToken?.decimals ?? 0)
  const tokenUsdPrice = fromSelectedToken?.priceIn.find(
    ({ baseCurrency }) => baseCurrency.toLowerCase() === 'usd'
  )?.price
  const maxSliderAmount =
    fromAmountFieldMode !== 'fiat'
      ? toAmountWei(maxFromAmount, sliderDecimals)
      : toMaxFiatAmountWei(maxFromAmount, fromSelectedToken?.decimals ?? 0, tokenUsdPrice)
  const sliderAmount = toAmountWei(fromAmountValue, sliderDecimals)
  const handleSliderValueChange = useCallback(
    (nextAmount: bigint) => {
      // Sliding all the way is the same as pressing Max, so the controller sets the exact max
      // itself (incl. any fee it reserves) instead of the slider's converted approximation of it.
      if (maxSliderAmount > 0n && nextAmount >= maxSliderAmount) {
        handleSetMaxFromAmount()
        return
      }

      onFromAmountChange(getSliderAmountFieldValue(nextAmount, maxSliderAmount, sliderDecimals))
    },
    [handleSetMaxFromAmount, maxSliderAmount, onFromAmountChange, sliderDecimals]
  )

  const tokenSelect = nonEmptySections?.length ? (
    <SectionedSelect
      setValue={handleChangeFromToken}
      sections={nonEmptySections}
      value={fromTokenValue}
      testID={selectTestId}
      bottomSheetTitle={t('Send token')}
      searchPlaceholder={t('Token name or address...')}
      emptyListPlaceholderText={t('No tokens found.')}
      containerStyle={{ ...spacings.mb0, ...flexbox.flex1 }}
      selectStyle={{ ...spacings.plTy, ...spacings.prSm }}
      mode="bottomSheet"
      headerHeight={SECTION_MENU_HEADER_HEIGHT}
      renderSectionHeader={renderSectionHeader}
      disabled={fromTokenAmountSelectDisabled}
      stickySectionHeadersEnabled
    />
  ) : (
    <Select
      setValue={handleChangeFromToken}
      options={fromTokenOptions}
      value={fromTokenValue}
      testID={selectTestId}
      bottomSheetTitle={t('Send token')}
      searchPlaceholder={t('Token name or address...')}
      emptyListPlaceholderText={t('No tokens found.')}
      containerStyle={{ ...spacings.mb0, ...flexbox.flex1 }}
      selectStyle={{ ...spacings.plTy, ...spacings.prSm }}
      mode="bottomSheet"
      disabled={fromTokenAmountSelectDisabled}
    />
  )

  const balance = useMemo(
    () => ({
      amount: Number(maxFromAmount),
      symbol: fromSelectedToken?.symbol || '',
      isLoading: !portfolio?.isReadyToVisualize,
      isInaccurate: simulationFailed
    }),
    [maxFromAmount, fromSelectedToken?.symbol, portfolio?.isReadyToVisualize, simulationFailed]
  )

  const hasPrice = !!fromSelectedToken && fromSelectedToken.priceIn.length !== 0
  const amountFieldModeSwitch = useMemo(
    () =>
      hasPrice
        ? {
            label:
              fromAmountFieldMode === 'token'
                ? `${
                    fromAmountInFiat
                      ? formatDecimals(parseFloat(fromAmountInFiat || '0'), 'price')
                      : '$0'
                  }`
                : `${fromAmount ? formatDecimals(parseFloat(fromAmount), 'amount') : 0} ${
                    fromSelectedToken?.symbol
                  }`,
            onPress: handleSwitchFromAmountFieldMode
          }
        : undefined,
    [
      hasPrice,
      fromAmountFieldMode,
      fromAmountInFiat,
      fromAmount,
      fromSelectedToken?.symbol,
      handleSwitchFromAmountFieldMode
    ]
  )

  const slider = useMemo(
    () => ({
      value: sliderAmount,
      maximumValue: maxSliderAmount,
      onValueChange: handleSliderValueChange
    }),
    [sliderAmount, maxSliderAmount, handleSliderValueChange]
  )

  const message = useMemo(
    () => ({ text: validateFromAmount?.message, severity: validateFromAmount?.severity }),
    [validateFromAmount?.message, validateFromAmount?.severity]
  )

  const testIDs = useMemo(
    () => ({
      amount: inputTestId,
      amountFieldModeSwitch: 'switch-currency-sab',
      maxButton: 'max-amount-button'
    }),
    [inputTestId]
  )

  return (
    <TokenAndAmountSelector
      label={label}
      token={tokenSelect}
      balance={balance}
      amountFieldModeSwitch={amountFieldModeSwitch}
      amountFieldMode={fromAmountFieldMode}
      amount={fromAmountValue}
      onAmountChange={handleOnChangeTextAndFormat}
      disabled={fromTokenAmountSelectDisabled}
      slider={slider}
      onMaxPress={handleSetMaxFromAmount}
      isMaxDisabled={maxAmountDisabled || !Number(maxFromAmount)}
      message={message}
      testIDs={testIDs}
      sliderStyle={sliderStyle}
    >
      {!!amountAdjustmentInfo && (
        <View
          testID="amount-adjustment-info"
          style={[
            flexbox.directionRow,
            flexbox.alignStart,
            spacings.mtSm,
            spacings.phSm,
            spacings.pvSm,
            {
              backgroundColor: theme.primaryAccent100,
              borderRadius: 12
            }
          ]}
        >
          <InfoIcon width={20} height={20} color={theme.primaryAccent} />
          <View style={[flexbox.flex1, spacings.mlSm]}>
            <Text fontSize={12} weight="semiBold">
              {t('Max amount adjusted')}
            </Text>
            <Text fontSize={12} appearance="secondaryText" style={spacings.mtMi}>
              {t('{{feeAmount}} {{tokenSymbol}} kept for the network fee', {
                feeAmount: formattedAdjustedFeeAmount,
                tokenSymbol: amountAdjustmentInfo.tokenSymbol
              })}
            </Text>
          </View>
        </View>
      )}
    </TokenAndAmountSelector>
  )
}

export default memo(SendToken)
