import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import gasTankFeeTokens from '@ambire-common/consts/gasTankFeeTokens'
import { TokenResult } from '@ambire-common/libs/portfolio'
import CoinsIcon from '@common/assets/svg/CoinsIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import Recipient from '@common/components/Recipient'
import { SectionedSelectProps, SelectValue } from '@common/components/Select/types'
import SendToken from '@common/components/SendToken'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getTokenId } from '@common/utils/token'
import { RELAYER_URL } from '@env'
import useSimulationError from '@web/modules/portfolio/hooks/SimulationError/useSimulationError'

type GasTankSection = {
  title: { icon: FC<SvgProps>; text: string }
  data: SelectValue[]
  key: string
}

const SendForm = ({
  addressInputState,
  canUseGasTank,
  amountErrorMessage,
  amountErrorSeverity,
  isRecipientAddressUnknown,
  isRecipientHumanizerKnownTokenOrSmartContract,
  amountFieldValue,
  setAmountFieldValue,
  addressStateFieldValue,
  setAddressStateFieldValue
}: {
  addressInputState: ReturnType<typeof useAddressInput>
  canUseGasTank: boolean
  amountErrorMessage: string
  amountErrorSeverity?: 'error' | 'warning' | 'info' | 'success'
  isRecipientAddressUnknown: boolean
  isRecipientHumanizerKnownTokenOrSmartContract: boolean
  amountFieldValue: string
  setAmountFieldValue: (value: string) => void
  addressStateFieldValue: string
  setAddressStateFieldValue: (value: string) => void
}) => {
  const { validation } = addressInputState
  const {
    state: {
      tokens,
      maxAmount,
      amountFieldMode,
      amountInFiat,
      selectedToken,
      isTopUp,
      addressState,
      amount: controllerAmount,
      areDefaultsSet
    },
    dispatch: transferDispatch
  } = useController('TransferController')
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')

  const { t } = useTranslation()
  const { theme } = useTheme()
  const { networks } = useController('NetworksController').state

  const [gasTankAssets, setGasTankAssets] = useState<
    { chainId?: number; address?: string; symbol?: string }[] | null
  >(null)

  useEffect(() => {
    if (!isTopUp) return
    fetch(`${RELAYER_URL}/gas-tank/assets`)
      .then((r) => r.json())
      .then((assets) => {
        const safeAssets = Array.isArray(assets)
          ? assets.filter(
              (asset): asset is { chainId: number; address: string; symbol?: string } =>
                !!asset?.address && asset?.chainId !== undefined && asset?.chainId !== null
            )
          : []

        setGasTankAssets(safeAssets)
      })
      .catch(() => setGasTankAssets(null))
  }, [isTopUp])
  const amountIsError = amountErrorSeverity === 'error' && !!amountErrorMessage

  const {
    value: tokenSelectValue,
    options,
    amountSelectDisabled
  } = useGetTokenSelectProps({
    tokens,
    token: selectedToken ? getTokenId(selectedToken) : '',
    networks,
    isToToken: false
  })

  const { simulationError } = useSimulationError({ chainId: selectedToken?.chainId })

  const disableForm = (!canUseGasTank && isTopUp) || !tokens.length

  const renderSectionHeader: SectionedSelectProps['renderSectionHeader'] = useCallback(
    ({ section }: { section: NonNullable<SectionedSelectProps['sections']>[number] }) => {
      const { title } = section as unknown as GasTankSection
      if (!title) return null
      return (
        <TitleAndIcon
          icon={title.icon}
          title={title.text}
          style={{ backgroundColor: theme.primaryBackground }}
        />
      )
    },
    [theme.primaryBackground]
  )

  const tokenSections: GasTankSection[] | undefined = useMemo(() => {
    if (!isTopUp) return undefined

    const getKey = (address: string | undefined, chainId: string | number | bigint | undefined) =>
      `${String(address).toLowerCase()}.${String(chainId)}`

    const enabledNetworkChainIds = new Set(networks.map((network) => network.chainId.toString()))

    const currentOptionKeys = new Set(
      options
        .filter((o): o is typeof o & { address: string; chainId: string | number | bigint } => {
          return 'address' in o && 'chainId' in o && !!o.address && o.chainId !== undefined
        })
        .map((o) => getKey(o.address, o.chainId))
    )

    const otherGasTokens = (gasTankAssets ?? [])
      .filter((asset) => {
        if (!asset.chainId || !enabledNetworkChainIds.has(asset.chainId.toString())) return false
        return !currentOptionKeys.has(getKey(asset.address, asset.chainId))
      })
      .map((asset) => {
        const feeToken = gasTankFeeTokens.find(
          (ft) =>
            ft.address.toLowerCase() === asset.address?.toLowerCase() &&
            ft.chainId === BigInt(asset.chainId!)
        )
        const network = networks.find((n) => n.chainId === BigInt(asset.chainId!))

        const symbol = (asset.symbol?.trim() || 'No symbol').toUpperCase()
        const networkName = network?.name ?? ''

        return {
          value: `${asset.address}.${asset.chainId}`,
          address: asset.address,
          chainId: asset.chainId,
          extraSearchProps: {
            symbol,
            address: asset.address,
            networkName
          },
          label: (
            <View style={flexbox.flex1}>
              <Text fontSize={16} weight="medium">
                {symbol}
              </Text>
              {!!networkName && (
                <Text fontSize={12} appearance="secondaryText" style={spacings.mt0}>
                  {'on ' + networkName}
                </Text>
              )}
            </View>
          ),
          icon: (
            <TokenIcon
              address={asset.address}
              chainId={BigInt(asset.chainId!)}
              withContainer
              containerHeight={32}
              containerWidth={32}
              width={28}
              height={28}
            />
          ),
          disabled: true
        }
      })

    return [
      {
        title: { icon: CoinsIcon, text: t('Tokens in current account') },
        data: options,
        key: 'gas-tank-topup-account-tokens'
      },
      {
        title: { icon: GasTankIcon, text: t('Other Gas tokens supported') },
        data: otherGasTokens,
        key: 'gas-tank-topup-other-tokens'
      }
    ].filter((section) => section.data.length > 0)
  }, [isTopUp, options, gasTankAssets, networks, t])

  const allFromTokenOptions = useMemo(() => {
    if (!tokenSections) return options
    return tokenSections.flatMap((section) => section.data) as typeof options
  }, [options, tokenSections])

  const handleChangeToken = useCallback(
    (value: string) => {
      const tokenToSelect = tokens.find((tokenRes: TokenResult) => getTokenId(tokenRes) === value)
      transferDispatch({
        type: 'method',
        params: {
          method: 'update',
          args: [
            {
              selectedToken: tokenToSelect,
              amount: ''
            }
          ]
        }
      })
    },
    [tokens, transferDispatch]
  )

  const setMaxAmount = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: {
        method: 'update',
        args: [
          {
            shouldSetMaxAmount: true
          }
        ]
      }
    })
  }, [transferDispatch])

  const switchAmountFieldMode = useCallback(() => {
    transferDispatch({
      type: 'method',
      params: {
        method: 'update',
        args: [
          {
            amountFieldMode: amountFieldMode === 'token' ? 'fiat' : 'token'
          }
        ]
      }
    })
  }, [amountFieldMode, transferDispatch])

  return (
    <>
      <View>
        {!isTopUp && (
          <Recipient
            disabled={disableForm}
            address={addressStateFieldValue}
            setAddress={setAddressStateFieldValue}
            validation={validation}
            resolvedAddress={addressState.resolvedAddress}
            resolvedAddressType={addressState.resolvedAddressType}
            addressValidationMsg={validation.message}
            isRecipientHumanizerKnownTokenOrSmartContract={
              isRecipientHumanizerKnownTokenOrSmartContract
            }
            isRecipientAddressUnknown={isRecipientAddressUnknown}
            isRecipientDomainResolving={addressState.isDomainResolving}
            selectedTokenSymbol={selectedToken?.symbol}
          />
        )}
      </View>

      {(!selectedToken && tokens.length) || !portfolio?.isReadyToVisualize || !areDefaultsSet ? (
        <SkeletonLoader width="100%" height={156} />
      ) : (
        <SendToken
          label={t('Send token')}
          fromTokenOptions={allFromTokenOptions}
          sections={tokenSections}
          renderSectionHeader={tokenSections ? renderSectionHeader : undefined}
          fromTokenValue={tokenSelectValue}
          fromAmountValue={amountFieldValue}
          fromTokenAmountSelectDisabled={disableForm || amountSelectDisabled}
          handleChangeFromToken={({ value }) => handleChangeToken(value as string)}
          fromSelectedToken={selectedToken}
          fromAmount={controllerAmount}
          fromAmountInFiat={amountInFiat}
          fromAmountFieldMode={amountFieldMode}
          maxFromAmount={maxAmount}
          validateFromAmount={{
            success: !amountIsError,
            message: amountErrorMessage,
            severity: amountErrorSeverity
          }}
          onFromAmountChange={setAmountFieldValue}
          handleSwitchFromAmountFieldMode={switchAmountFieldMode}
          handleSetMaxFromAmount={setMaxAmount}
          inputTestId="amount-field"
          selectTestId="tokens-select"
          simulationFailed={!!simulationError}
        />
      )}
    </>
  )
}

export default React.memo(SendForm)
