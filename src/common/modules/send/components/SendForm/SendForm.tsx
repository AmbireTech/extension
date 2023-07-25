import React from 'react'
import isEqual from 'react-fast-compare'
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native'

import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import InputSendToken from '@common/components/InputSendToken'
import NumberInput from '@common/components/NumberInput'
import Panel from '@common/components/Panel'
import Recipient from '@common/components/Recipient'
import Select from '@common/components/Select'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

interface Props {
  isHidden: boolean
  asset: string | null
  address: any
  amount: number
  assetsItems: {
    label: any
    value: any
    icon: () => JSX.Element
  }[]
  maxAmount: string | number
  selectedAsset: any
  disabled: boolean
  addressConfirmed: boolean
  uDAddress: string
  ensAddress: string
  sWAddressConfirmed: boolean
  showSWAddressWarning: boolean
  validationFormMgs: {
    success: {
      amount: boolean
      address: boolean
    }
    messages: {
      amount: string
      address: string
    }
  }
  onSendPress: () => void
  setAsset: React.Dispatch<React.SetStateAction<string | null>>
  onAmountChange: (value: any) => void
  setMaxAmount: () => void
  setAddress: React.Dispatch<React.SetStateAction<string>>
  setAddressConfirmed: React.Dispatch<React.SetStateAction<boolean>>
  setSWAddressConfirmed: React.Dispatch<React.SetStateAction<boolean>>
}

const unsupportedSWPlatforms = ['Binance', 'Huobi', 'KuCoin', 'Gate.io', 'FTX']

const SendForm = ({
  isHidden,
  asset,
  address,
  amount,
  assetsItems,
  maxAmount,
  selectedAsset,
  disabled,
  addressConfirmed,
  uDAddress,
  ensAddress,
  sWAddressConfirmed,
  showSWAddressWarning,
  validationFormMgs,
  onSendPress,
  setAsset,
  onAmountChange,
  setMaxAmount,
  setAddress,
  setAddressConfirmed,
  setSWAddressConfirmed
}: Props) => {
  const { t } = useTranslation()

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        !isWeb && Keyboard.dismiss()
      }}
    >
      {assetsItems.length ? (
        <>
          <Panel style={[spacings.mb0, { flexGrow: 1 }, isHidden && commonStyles.visibilityHidden]}>
            <Title style={textStyles.center}>{t('Send')}</Title>
            <View style={spacings.mbMi}>
              <Select
                value={asset}
                items={assetsItems.sort((a, b) =>
                  a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1
                )}
                setValue={setAsset}
              />
            </View>
            <InputSendToken
              amount={amount}
              selectedAssetBalanceUSD={selectedAsset?.balanceUSD}
              selectedAssetBalance={selectedAsset?.balance}
              selectedAssetDecimals={selectedAsset?.decimals}
              selectedAssetSymbol={selectedAsset?.symbol}
              maxAmount={maxAmount}
              errorMessage={validationFormMgs?.messages?.amount}
              onAmountChange={onAmountChange}
              setMaxAmount={setMaxAmount}
            />
            <Recipient
              setAddress={setAddress}
              address={address}
              uDAddress={uDAddress}
              ensAddress={ensAddress}
              addressValidationMsg={validationFormMgs?.messages?.address}
              setAddressConfirmed={setAddressConfirmed}
              addressConfirmed={addressConfirmed}
            />
            {showSWAddressWarning && (
              <Checkbox
                value={sWAddressConfirmed}
                onValueChange={() => setSWAddressConfirmed(!sWAddressConfirmed)}
              >
                <Text fontSize={12} onPress={() => setSWAddressConfirmed(!sWAddressConfirmed)}>
                  {
                    t(
                      'I confirm this address is not a {{platforms}} address: These platforms do not support {{token}} deposits from smart wallets.',
                      {
                        platforms: unsupportedSWPlatforms.join(' / '),
                        token: selectedAsset?.symbol
                      }
                    ) as string
                  }
                </Text>
              </Checkbox>
            )}
          </Panel>
          <View style={[spacings.phSm, spacings.mbMd, isHidden && commonStyles.visibilityHidden]}>
            <Button text={t('Send')} disabled={disabled} onPress={onSendPress} />
          </View>
        </>
      ) : (
        <Panel style={[{ flexGrow: 1 }, isHidden && commonStyles.visibilityHidden]}>
          <Text fontSize={16} style={textStyles.center}>
            {t("You don't have any funds on this account.")}
          </Text>
        </Panel>
      )}
    </TouchableWithoutFeedback>
  )
}

export default React.memo(SendForm, isEqual)
