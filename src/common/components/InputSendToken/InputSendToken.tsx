import React, { useCallback } from 'react'
import isEqual from 'react-fast-compare'
import { View } from 'react-native'

import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

interface Props {
  amount: number
  selectedAssetSymbol: string
  maxAmount: number
  errorMessage: string
  onAmountChange: (value: any) => void
  setMaxAmount: () => void
}

const SendForm = ({
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
    setMaxAmount()
  }, [setMaxAmount])

  const amountLabel = (
    <View style={[flexboxStyles.directionRow, spacings.mbMi, spacings.mbTy, spacings.mlTy]}>
      <Text weight="regular" style={spacings.mr}>
        {t('Available Amount:')}
      </Text>

      <View style={[flexboxStyles.directionRow, flexboxStyles.flex1]}>
        <Text numberOfLines={1} style={{ flex: 1, textAlign: 'right' }} ellipsizeMode="tail">
          {maxAmount.toFixed(maxAmount < 1 ? 8 : 4)}
        </Text>
        {!!selectedAssetSymbol && <Text>{` ${selectedAssetSymbol.toUpperCase()}`}</Text>}
      </View>
    </View>
  )

  return (
    <>
      {amountLabel}
      <View style={[flexboxStyles.directionRow, spacings.mbSm]}>
        <NumberInput
          onChangeText={handleOnTokenAmountChange}
          containerStyle={[spacings.mbTy, flexboxStyles.flex1]}
          value={amount.toString()}
          placeholder={t('0')}
          error={errorMessage || undefined}
          button={t('MAX')}
          onButtonPress={handleSetMaxAmount}
        />
      </View>
    </>
  )
}

export default React.memo(SendForm, isEqual)
