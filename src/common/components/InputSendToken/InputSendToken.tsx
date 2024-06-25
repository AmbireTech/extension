import { isNumber } from 'lodash'
import React, { useCallback, useState } from 'react'
import isEqual from 'react-fast-compare'
import { View } from 'react-native'

import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

interface Props {
  amount: number
  selectedAssetBalanceUSD: string
  selectedAssetBalance: string
  selectedAssetDecimals: number
  selectedAssetSymbol: string
  maxAmount: string | number
  errorMessage: string
  onAmountChange: (value: any) => void
  setMaxAmount: () => void
}

const SendForm = ({
  amount,
  selectedAssetBalanceUSD,
  selectedAssetBalance,
  selectedAssetDecimals,
  selectedAssetSymbol,
  onAmountChange,
  setMaxAmount,
  maxAmount,
  errorMessage
}: Props) => {
  const { t } = useTranslation()

  const pricePerOne =
    isNumber(selectedAssetBalanceUSD) &&
    isNumber(selectedAssetBalance) &&
    selectedAssetBalance !== 0
      ? // This is handled by the above isNumber check, but ESLint doesn't know that
        // eslint-disable-next-line no-unsafe-optional-chaining
        +(selectedAssetBalanceUSD / selectedAssetBalance).toFixed(selectedAssetDecimals)
      : 0
  const [amountInUsd, setAmountInUsd] = useState((pricePerOne * amount).toFixed(2))

  const handleOnTokenAmountChange = useCallback(
    (valueInTokenAmount: string) => {
      onAmountChange(valueInTokenAmount)

      const nextAmountInUsd = (pricePerOne * +valueInTokenAmount).toFixed(2)
      setAmountInUsd(nextAmountInUsd)
    },
    [onAmountChange, pricePerOne]
  )

  const handleOnUsdAmountChange = useCallback(
    (valueInUsd: string) => {
      if (+selectedAssetBalanceUSD === 0 || !isNumber(selectedAssetBalanceUSD)) {
        onAmountChange(selectedAssetBalance.toString())
        setAmountInUsd('')
        return
      }

      if (+valueInUsd === 0) {
        onAmountChange('')
        setAmountInUsd(valueInUsd)
        return
      }

      const valueInAmount = (
        (Number(valueInUsd) * Number(maxAmount)) /
        // This is handled by the above isNumber check, but ESLint doesn't know that
        // eslint-disable-next-line no-unsafe-optional-chaining
        Number(selectedAssetBalanceUSD)
      ).toString()
      onAmountChange(valueInAmount)
      setAmountInUsd(valueInUsd)
    },
    [onAmountChange, selectedAssetBalance, selectedAssetBalanceUSD, selectedAssetDecimals]
  )

  const handleSetMaxAmount = useCallback(() => {
    setMaxAmount()
    handleOnUsdAmountChange(selectedAssetBalanceUSD)
  }, [handleOnUsdAmountChange, selectedAssetBalanceUSD, setMaxAmount])

  const amountLabel = (
    <View style={[flexboxStyles.directionRow, spacings.mbMi]}>
      <Text style={spacings.mr}>{t('Available Amount:')}</Text>

      <View style={[flexboxStyles.directionRow, flexboxStyles.flex1]}>
        <Text numberOfLines={1} style={{ flex: 1, textAlign: 'right' }} ellipsizeMode="tail">
          {maxAmount}
        </Text>
        {!!selectedAssetSymbol && <Text>{` ${selectedAssetSymbol.toUpperCase()}`}</Text>}
      </View>
    </View>
  )

  return (
    <>
      {amountLabel}
      <View style={flexboxStyles.directionRow}>
        <NumberInput
          onChangeText={handleOnTokenAmountChange}
          containerStyle={[spacings.mbTy, flexboxStyles.flex1]}
          value={amount.toString()}
          placeholder={t('0')}
          inputBackgroundStyle={styles.amountInTokenInputBackgroundStyle}
          error={errorMessage || undefined}
        />
        <NumberInput
          onChangeText={handleOnUsdAmountChange}
          containerStyle={[spacings.mbTy, flexboxStyles.flex1]}
          inputBackgroundStyle={styles.amountInUSDInputBackgroundStyle}
          value={amountInUsd.toString()}
          leftIcon={() => (
            <Text weight="medium" fontSize={16} style={styles.amountInUsdIcon}>
              {t('$')}
            </Text>
          )}
          button={t('MAX')}
          placeholder={t('0')}
          onButtonPress={handleSetMaxAmount}
        />
      </View>
    </>
  )
}

export default React.memo(SendForm, isEqual)
