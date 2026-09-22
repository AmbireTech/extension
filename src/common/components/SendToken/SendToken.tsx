import { formatUnits, parseUnits } from 'ethers'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { textToValidDecimal } from '@ambire-common/utils/numbers/formatters'
import FlipIcon from '@common/assets/svg/FlipIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import AmountInput from '@common/components/AmountInput'
import AmountSlider from '@common/components/AmountSlider'
import Select, { SectionedSelect } from '@common/components/Select'
import { SectionedSelectProps, SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import MaxAmount from '@common/modules/swap-and-bridge/components/MaxAmount'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { ItemPanel } from '@web/components/TransactionsScreen'

import getStyles from './styles'

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
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const isError = validateFromAmount?.severity === 'error' && !!validateFromAmount?.message
  const isWarning = validateFromAmount?.severity === 'warning' && !!validateFromAmount?.message

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
      : toAmountWei(
          (Number(maxFromAmount) * (tokenUsdPrice || 0)).toFixed(FIAT_DECIMALS),
          FIAT_DECIMALS
        )
  const sliderAmount = toAmountWei(fromAmountValue, sliderDecimals)
  const handleSliderValueChange = useCallback(
    (nextAmount: bigint) => onFromAmountChange(formatUnits(nextAmount, sliderDecimals)),
    [onFromAmountChange, sliderDecimals]
  )

  const amountInput = (
    <AmountInput
      type={fromAmountFieldMode}
      value={fromAmountValue}
      onChangeText={handleOnChangeTextAndFormat}
      disabled={fromTokenAmountSelectDisabled}
      inputTestId={inputTestId}
      // Matches the received amount ToToken renders right below it
      fontSize={20}
    />
  )

  return (
    <>
      <View style={[styles.outerContainer, isError ? styles.outerContainerError : {}]}>
        <ItemPanel
          style={{
            // magic number to match the curve of the outer container
            // which is with borderRadius: 16
            borderRadius: 13,
            ...spacings.pvSm,
            ...spacings.prSm,
            ...(isError ? styles.containerError : {})
          }}
        >
          <Text appearance="secondaryText" fontSize={14} weight="medium" style={spacings.mbSm}>
            {label}
          </Text>
          <View style={styles.balanceRow}>
            {!fromTokenAmountSelectDisabled ? (
              <MaxAmount
                isLoading={!portfolio?.isReadyToVisualize}
                maxAmount={Number(maxFromAmount)}
                selectedTokenSymbol={fromSelectedToken?.symbol || ''}
                onMaxButtonPress={handleSetMaxFromAmount}
                disabled={maxAmountDisabled}
                simulationFailed={simulationFailed}
              />
            ) : (
              // Prevent layout shifting
              <View style={{ height: 22 }} />
            )}
            {fromSelectedToken && fromSelectedToken.priceIn.length !== 0 ? (
              <Pressable
                onPress={handleSwitchFromAmountFieldMode}
                style={styles.switchAmountFieldMode}
                disabled={fromTokenAmountSelectDisabled}
              >
                {({ hovered }: any) => (
                  <>
                    <Text
                      fontSize={12}
                      color={theme.secondaryText}
                      weight="medium"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={styles.switchAmountFieldModeValue}
                      testID="switch-currency-sab"
                    >
                      {fromAmountFieldMode === 'token'
                        ? `${
                            fromAmountInFiat
                              ? formatDecimals(parseFloat(fromAmountInFiat || '0'), 'price')
                              : '$0'
                          }`
                        : `${fromAmount ? formatDecimals(parseFloat(fromAmount), 'amount') : 0} ${
                            fromSelectedToken?.symbol
                          }`}
                    </Text>
                    <View
                      style={[
                        styles.switchAmountFieldModeIcon,
                        {
                          backgroundColor: hovered
                            ? hexToRgba(theme.primaryAccent200, 0.16)
                            : theme.primaryAccent100
                        }
                      ]}
                    >
                      <FlipIcon width={11} height={11} color={theme.primary} />
                    </View>
                  </>
                )}
              </Pressable>
            ) : (
              <View />
            )}
          </View>
          <View style={styles.tokenRow}>
            <View style={flexbox.flex1}>
              {nonEmptySections?.length ? (
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
              )}
            </View>
            {isWeb ? (
              // The column runs under the select's last stretch, so it must not swallow the
              // clicks that belong to it - its own content is padded clear of it
              <View style={styles.amountColumn} pointerEvents="box-none">
                {amountInput}
              </View>
            ) : (
              amountInput
            )}
          </View>
          <View style={[styles.slider, sliderStyle]}>
            <AmountSlider
              value={sliderAmount}
              maximumValue={fromTokenAmountSelectDisabled ? 0n : maxSliderAmount}
              onValueChange={handleSliderValueChange}
            />
          </View>
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
        </ItemPanel>
      </View>
      {validateFromAmount?.message && (
        <Text
          fontSize={12}
          style={[spacings.mlMi, spacings.mtMi]}
          appearance={isWarning ? 'warningText' : 'errorText'}
        >
          {validateFromAmount?.message}
        </Text>
      )}
    </>
  )
}

export default memo(SendToken)
