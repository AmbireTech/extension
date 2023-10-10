import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { Token, UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio'
import { isValidAddress } from 'ambire-common/src/services/address'
import { isNumber } from 'lodash'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Spinner from '@common/components/Spinner'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import useToken from '@common/hooks/useToken'
import spacings from '@common/styles/spacings'

import { MODES } from './constants'
import FoundTokenItem from './FoundTokenItem'

const ADDRESS_LENGTH = 42
const TOKEN_SYMBOL_MIN_LENGTH = 3

interface Props {
  mode: MODES
  onSubmit: (token: Token, formMode: MODES) => void
  enableSymbolSearch?: boolean
  tokens: UsePortfolioReturnType['tokens']
  networkId?: NetworkId
  networkName?: NetworkType['name']
}

const AddOrHideTokenForm: React.FC<Props> = ({
  mode,
  onSubmit,
  enableSymbolSearch = false,
  tokens,
  networkId,
  networkName
}) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState<boolean>(false)
  const [tokenDetails, setTokenDetails] = useState<any>(null)
  const { getTokenDetails } = useToken()
  const [showError, setShowError] = useState<string>('')
  const { addToast } = useToast()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm({
    defaultValues: {
      address: ''
    }
  })

  const disabled = !tokenDetails || !(tokenDetails.symbol && isNumber(tokenDetails.decimals))

  const tokenStandard =
    // eslint-disable-next-line no-nested-ternary
    networkId === 'binance-smart-chain'
      ? 'a BEP20'
      : networkId === 'ethereum'
      ? 'an ERC20'
      : 'a valid'

  const onInput = async (inputText: string) => {
    let foundByAddressOrSymbol
    setTokenDetails(null)
    setShowError('')

    if (inputText.length === ADDRESS_LENGTH && !isValidAddress(inputText))
      return addToast(`Invalid address: ${inputText}`, { error: true })

    if (enableSymbolSearch && inputText) {
      const lowerCaseInputText = inputText.toLowerCase()

      const fullMatch = tokens.find(
        (i) =>
          i.symbol.toLowerCase() === lowerCaseInputText ||
          i.address.toLowerCase() === lowerCaseInputText
      )

      const partialMatch = tokens.find(
        (i) =>
          i.symbol.toLowerCase().includes(lowerCaseInputText) ||
          i.address.toLowerCase().includes(lowerCaseInputText)
      )

      foundByAddressOrSymbol = fullMatch || partialMatch

      if (foundByAddressOrSymbol) {
        setTokenDetails({
          ...foundByAddressOrSymbol,
          name: `${foundByAddressOrSymbol.symbol} on ${foundByAddressOrSymbol.network}`
        })
        return
      }

      if (inputText.length >= TOKEN_SYMBOL_MIN_LENGTH) {
        setShowError(
          t(
            "The address/symbol you entered does not appear to correspond to you assets list or it's already hidden."
          ) as string
        )
      }
    }

    if (!isValidAddress(inputText)) return

    setLoading(true)
    setShowError('')

    try {
      const token = await getTokenDetails(inputText)

      if (!token) throw new Error('Failed to load token info')

      setTokenDetails(token)
    } catch {
      addToast('Failed to load token info', { error: true })
      setShowError(
        t(
          'The address you entered does not appear to correspond to {{tokenStandard}} token on {{networkName}}.',
          { tokenStandard, networkName }
        ) as string
      )
    }

    setLoading(false)
  }

  const handleOnPress = handleSubmit(() => {
    onSubmit(tokenDetails, mode)
    reset()
    setTokenDetails(null)
    setShowError('')
  })

  const buttonSubmitText = t('Hide')
  const buttonSubmittingText = t('Hiding...')

  return (
    <>
      <Controller
        control={control}
        rules={enableSymbolSearch ? undefined : { validate: isValidAddress }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={
              enableSymbolSearch ? t('Collectible Address or Symbol') : t('Collectible Address')
            }
            placeholder={t('0x...')}
            autoFocus
            onBlur={onBlur}
            onChangeText={(text: string) => {
              onInput(text)
              return onChange(text)
            }}
            value={value}
            error={showError}
          />
        )}
        name="address"
      />

      {loading && (
        <View style={spacings.mb}>
          <Spinner />
        </View>
      )}

      {!showError && tokenDetails && <FoundTokenItem {...tokenDetails} />}

      <Button
        text={isSubmitting ? buttonSubmittingText : buttonSubmitText}
        disabled={isSubmitting || disabled}
        onPress={handleOnPress}
      />
    </>
  )
}

export default AddOrHideTokenForm
