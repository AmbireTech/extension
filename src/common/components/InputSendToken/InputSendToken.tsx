import React, { useCallback } from 'react'
import isEqual from 'react-fast-compare'
import { Pressable, View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import FlipIcon from '@common/assets/svg/FlipIcon'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import SkeletonLoader from '../SkeletonLoader'

import type { TransferController } from '@ambire-common/controllers/transfer/transfer'
const MaxAmount = ({
  maxAmount,
  maxAmountInFiat,
  selectedTokenSymbol,
  isLoading
}: {
  maxAmount: number | null
  maxAmountInFiat: number | null
  selectedTokenSymbol: string
  isLoading: boolean
}) => {
  const { t } = useTranslation()
  if (maxAmount === null) return null

  return selectedTokenSymbol && !isLoading ? (
    <View style={flexbox.directionRow}>
      <Text
        testID="max-available-amount"
        numberOfLines={1}
        fontSize={12}
        appearance="secondaryText"
        ellipsizeMode="tail"
      >
        {t('Available Amount: ')}
        {`${maxAmount === 0 ? 0 : formatDecimals(maxAmount, 'amount')} ${selectedTokenSymbol} /`}
        {` ${maxAmountInFiat ? formatDecimals(maxAmountInFiat, 'value') : 0} USD`}
      </Text>
    </View>
  ) : (
    <SkeletonLoader height={22} width={100} />
  )
}

type Props = {
  selectedTokenSymbol: string
  errorMessage: string
  onAmountChange: (value: any) => void
  setMaxAmount: () => void
  switchAmountFieldMode: () => void
  isSwitchAmountFieldModeDisabled: boolean
  isLoading: boolean
  disabled?: boolean
} & Pick<
  TransferController,
  'amount' | 'amountFieldMode' | 'amountInFiat' | 'maxAmount' | 'maxAmountInFiat'
>

const InputSendToken = ({
  amount,
  amountInFiat,
  selectedTokenSymbol,
  onAmountChange,
  setMaxAmount,
  maxAmount,
  maxAmountInFiat,
  amountFieldMode,
  switchAmountFieldMode,
  isSwitchAmountFieldModeDisabled,
  errorMessage,
  disabled,
  isLoading
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const handleOnTokenAmountChange = useCallback(
    (valueInTokenAmount: string) => {
      onAmountChange(valueInTokenAmount)
    },
    [onAmountChange]
  )

  const handleSetMaxAmount = useCallback(() => {
    if (!maxAmount) return
    setMaxAmount()
  }, [setMaxAmount, maxAmount])

  const dollarIcon = useCallback(() => {
    if (amountFieldMode === 'token') return null

    return <Text>$</Text>
  }, [amountFieldMode])

  return (
    <View style={spacings.mbLg}>
      <Text weight="regular" fontSize={14} appearance="secondaryText" style={spacings.mbMi}>
        {t('Enter Amount')}
      </Text>
      <NumberInput
        testID="amount-field"
        onChangeText={handleOnTokenAmountChange}
        containerStyle={spacings.mbMi}
        value={amountFieldMode === 'fiat' ? amountInFiat : amount}
        placeholder={amountFieldMode === 'fiat' ? '0 USD' : `0 ${selectedTokenSymbol}`}
        error={errorMessage || undefined}
        button={maxAmount ? t('Max') : null}
        leftIcon={dollarIcon}
        leftIconStyle={amountFieldMode === 'token' ? spacings.pl0 : spacings.plTy}
        inputStyle={amountFieldMode === 'token' ? {} : spacings.plMi}
        onButtonPress={handleSetMaxAmount}
        buttonProps={{ withBackground: true, disabled: disabled || isLoading }}
        disabled={disabled}
      />
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          common.fullWidth
        ]}
      >
        {!isSwitchAmountFieldModeDisabled ? (
          <Pressable
            onPress={switchAmountFieldMode}
            style={[flexbox.directionRow, flexbox.alignCenter]}
            disabled={disabled}
          >
            <View
              style={{
                backgroundColor: theme.infoBackground,
                borderRadius: 50,
                paddingHorizontal: 5,
                paddingVertical: 5,
                ...spacings.mhTy
              }}
            >
              <FlipIcon width={11} height={11} color={theme.primary} />
            </View>
            <Text fontSize={12} appearance="primary" weight="medium">
              {amountFieldMode === 'token'
                ? `≈ ${amountInFiat ? formatDecimals(Number(amountInFiat), 'value') : 0} USD`
                : `${amount ? formatDecimals(Number(amount), 'amount') : 0} ${selectedTokenSymbol}`}
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
        {!disabled && (
          <MaxAmount
            isLoading={isLoading}
            maxAmount={Number(maxAmount)}
            maxAmountInFiat={Number(maxAmountInFiat)}
            selectedTokenSymbol={selectedTokenSymbol}
          />
        )}
      </View>
    </View>
  )
}

export default React.memo(InputSendToken, isEqual)
