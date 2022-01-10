import ERC20ABI from 'adex-protocol-eth/abi/ERC20'
import { Contract, getDefaultProvider } from 'ethers'
import { formatUnits, Interface } from 'ethers/lib/utils'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ActivityIndicator, Image, View } from 'react-native'

import { Trans, useTranslation } from '@config/localization'
import Button from '@modules/common/components/Button'
import Input from '@modules/common/components/Input'
import Text from '@modules/common/components/Text'
import useAccounts from '@modules/common/hooks/useAccounts'
import useNetwork from '@modules/common/hooks/useNetwork'
import { isValidAddress } from '@modules/common/services/address'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'

import styles from './styles'

const ERC20Interface = new Interface(ERC20ABI)

interface Props {
  onSubmit: (t: any) => void
}

const AddTokenForm: React.FC<Props> = ({ onSubmit }) => {
  const { t } = useTranslation()
  const { selectedAcc: account } = useAccounts()
  const { network } = useNetwork()
  const [loading, setLoading] = useState(false)
  const [tokenDetails, setTokenDetails] = useState(null)
  const [showError, setShowError] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      address: ''
    }
  })

  const disabled = !tokenDetails || !(tokenDetails.symbol && tokenDetails.decimals)

  const tokenStandard =
    network?.id === 'binance-smart-chain'
      ? 'a BEP20'
      : network?.id === 'ethereum'
      ? 'an ERC20'
      : 'a valid'

  const onInput = async (address: string) => {
    setTokenDetails(null)

    if (!isValidAddress(address)) return
    setLoading(true)
    setShowError(false)

    try {
      const provider = getDefaultProvider(network.rpc)
      const tokenContract = new Contract(address, ERC20Interface, provider)

      const [balanceOf, name, symbol, decimals] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals()
      ])

      const balance = formatUnits(balanceOf, decimals)
      setTokenDetails({
        account,
        address,
        network: network.id,
        balance,
        balanceRaw: balanceOf.toString(),
        tokenImageUrl: `https://storage.googleapis.com/zapper-fi-assets/tokens/${network.id}/${address}.png`,
        name,
        symbol,
        decimals
      })
    } catch (e) {
      console.error(e)
      // addToast('Failed to load token info', { error: true })
      setShowError(true)
    }

    setLoading(false)
  }

  const handleOnPress = handleSubmit(() => {
    onSubmit(tokenDetails)
    reset()
    setTokenDetails(null)
  })

  return (
    <>
      <Controller
        control={control}
        // rules={{ validate: isAddress }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('Token Address')}
            placeholder={t('0x...')}
            onBlur={onBlur}
            onChangeText={(text: string) => {
              onInput(text)
              return onChange(text)
            }}
            value={value}
          />
        )}
        name="address"
      />

      {loading && <ActivityIndicator />}

      {showError && (
        <Text>
          {t(
            'The address you entered does not appear to correspond to {{tokenStandard}} token on {{networkName}}.',
            { tokenStandard, networkName: network?.name }
          )}
        </Text>
      )}

      {!showError && tokenDetails && (
        <>
          <View style={[flexboxStyles.center, spacings.mb]}>
            <Text style={spacings.mbTy}>
              <Image style={styles.img} source={{ uri: tokenDetails.tokenImageUrl }} />{' '}
              {tokenDetails.name} ({tokenDetails.symbol})
            </Text>
            <Trans>
              <Text>
                Balance: <Text style={textStyles.highlightPrimary}>{tokenDetails.balance}</Text>{' '}
                <Text style={textStyles.bold}>{tokenDetails.symbol}</Text>
              </Text>
            </Trans>
          </View>
        </>
      )}

      <Button
        text={isSubmitting ? t('Adding...') : t('Add')}
        style={spacings.mb0}
        disabled={isSubmitting || disabled}
        onPress={handleOnPress}
      />
    </>
  )
}

export default AddTokenForm
