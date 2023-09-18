import React, { useCallback } from 'react'
import isEqual from 'react-fast-compare'
import { View } from 'react-native'

import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'

import styles from './styles'

const MaxAmount = ({
  maxAmount,
  selectedAssetSymbol
}: {
  maxAmount: number | null
  selectedAssetSymbol: string
}) => {
  const { t } = useTranslation()

  return (
    <View style={styles.maxAmount}>
      <Text weight="regular" style={styles.maxAmountLabel}>
        {t('Available Amount:')}
      </Text>

      {maxAmount ? (
        <View style={styles.maxAmountValueWrapper}>
          <Text numberOfLines={1} style={styles.maxAmountValue} ellipsizeMode="tail">
            {maxAmount.toFixed(maxAmount < 1 ? 8 : 4)}
          </Text>
          {!!selectedAssetSymbol && <Text>{` ${selectedAssetSymbol.toUpperCase()}`}</Text>}
        </View>
      ) : null}
    </View>
  )
}

interface Props {
  amount: number
  selectedAssetSymbol: string
  maxAmount: number | null
  errorMessage: string
  onAmountChange: (value: any) => void
  setMaxAmount: () => void
}

const InputSendToken = ({
  amount,
  selectedAssetSymbol,
  onAmountChange,
  setMaxAmount,
  maxAmount,
  errorMessage
}: Props) => {
  const { t } = useTranslation()

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

  return (
    <>
      <MaxAmount maxAmount={maxAmount} selectedAssetSymbol={selectedAssetSymbol} />
      <View style={styles.inputWrapper}>
        <NumberInput
          onChangeText={handleOnTokenAmountChange}
          containerStyle={styles.inputContainerStyle}
          value={amount.toString()}
          placeholder={t('0')}
          error={errorMessage || undefined}
          button={maxAmount ? t('MAX') : null}
          onButtonPress={handleSetMaxAmount}
        />
      </View>
    </>
  )
}

export default React.memo(InputSendToken, isEqual)
