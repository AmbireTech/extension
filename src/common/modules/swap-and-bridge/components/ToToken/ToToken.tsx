import { formatUnits, isAddress } from 'ethers'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SwapAndBridgeFormStatus } from '@ambire-common/libs/swapAndBridge/constants'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import WalletIcon from '@common/assets/svg/WalletIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import getStyles from '@common/components/TokenAndAmountSelector/styles'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import useNetworks from '@common/hooks/useNetworks'
import useTheme from '@common/hooks/useTheme'
import SwitchTokensButton from '@common/modules/swap-and-bridge/components/SwitchTokensButton'
import ToTokenSelect from '@common/modules/swap-and-bridge/components/ToToken/ToTokenSelect'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { sortNetworksByBalance } from '@common/utils/sorting'
import { getTokenId } from '@common/utils/token'
import { ItemPanel } from '@web/components/TransactionsScreen'

import NotSupportedNetworkTooltip from '../NotSupportedNetworkTooltip'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Props = {
  simulationFailed?: boolean
  disabled?: boolean
  openProviderSettingsModal: () => void
}

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

const ToToken: FC<Props> = ({ simulationFailed, disabled = false, openProviderSettingsModal }) => {
  const { theme, themeType, styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const {
    statuses: swapAndBridgeCtrlStatuses,
    toSelectedToken,
    updateQuoteStatus,
    toTokenShortList,
    toTokenSearchResults,
    toTokenSearchTerm,
    fromSelectedToken,
    quote,
    formStatus,
    toChainId,
    updateToTokenListStatus,
    switchTokensStatus,
    supportedChainIds,
    disabledSwapProviderIds,
    signAccountOpController
  } = useController('SwapAndBridgeController').state
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')

  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: balancePerNetwork } = useController(
    'SelectedAccountController',
    (state) => state.portfolio.balancePerNetwork
  )
  const networks = useNetworks({
    acc: account,
    additionalCheck: {
      chainIds: supportedChainIds,
      reason: t(
        disabledSwapProviderIds.length
          ? 'Network is not supported by the enabled service providers. Enable more providers for wider support'
          : 'Network is not supported by our service provider.'
      )
    }
  })

  const handleSwitchFromAndToTokens = useCallback(
    () =>
      swapAndBridgeDispatch({
        type: 'method',
        params: { method: 'switchFromAndToTokens', args: [] }
      }),
    [swapAndBridgeDispatch]
  )

  const handleSetToNetworkValue = useCallback(
    (networkOption: SelectValue) => {
      swapAndBridgeDispatch({
        type: 'method',
        params: {
          method: 'updateForm',
          args: [
            {
              toChainId: networks.filter((n) => String(n.chainId) === networkOption.value)[0]
                ?.chainId
            },
            { isToSelectionByUser: true }
          ]
        }
      })
    },
    [networks, swapAndBridgeDispatch]
  )

  const tokensInToTokenSelect = useMemo(() => {
    if (toTokenSearchTerm) return toTokenSearchResults

    // Token might not be in the short list (if it's pulled from search for example)
    const isSelectTokenMissingInToTokenShortList =
      toSelectedToken &&
      !toTokenShortList.some(
        (tk) => tk.address === toSelectedToken.address && tk.chainId === toSelectedToken.chainId
      )

    return isSelectTokenMissingInToTokenShortList
      ? [toSelectedToken, ...toTokenShortList]
      : toTokenShortList
  }, [toTokenSearchTerm, toTokenSearchResults, toSelectedToken, toTokenShortList])

  const {
    options: toTokenOptions,
    value: toTokenValue,
    amountSelectDisabled: toTokenAmountSelectDisabled
  } = useGetTokenSelectProps({
    tokens: tokensInToTokenSelect,
    token: toSelectedToken ? getTokenId(toSelectedToken) : '',
    networks,
    isLoading: !toTokenShortList.length && updateToTokenListStatus !== 'INITIAL',
    isToToken: true
  })

  const shouldShowAmountOnEstimationFailure = useMemo(() => {
    return (
      quote?.selectedRoute?.isSelectedManually &&
      signAccountOpController?.estimation.status === EstimationStatus.Error
    )
  }, [quote?.selectedRoute?.isSelectedManually, signAccountOpController?.estimation.status])

  const isReadyToDisplayAmounts =
    (formStatus === SwapAndBridgeFormStatus.Empty ||
      formStatus === SwapAndBridgeFormStatus.Invalid ||
      formStatus === SwapAndBridgeFormStatus.NoRoutesFound ||
      formStatus === SwapAndBridgeFormStatus.ReadyToSubmit ||
      formStatus === SwapAndBridgeFormStatus.Proceeded ||
      (formStatus === SwapAndBridgeFormStatus.InvalidRouteSelected &&
        quote?.selectedRoute?.isSelectedManually) ||
      shouldShowAmountOnEstimationFailure) &&
    updateQuoteStatus !== 'LOADING'

  const toNetworksOptions: SelectValue[] = useMemo(
    () =>
      sortNetworksByBalance(networks, balancePerNetwork).map((n) => {
        const tooltipId = `network-${n.chainId}-not-supported-tooltip`

        return {
          value: String(n.chainId),
          extraSearchProps: { name: n.name },
          disabled: n.isNotSupported,
          label: (
            <>
              <Text
                fontSize={14}
                appearance="secondaryText"
                weight="medium"
                dataSet={{ tooltipId }}
                style={flexbox.flex1}
                numberOfLines={1}
              >
                {n.name}
              </Text>
              {n.isNotSupported && (
                <NotSupportedNetworkTooltip
                  tooltipId={tooltipId}
                  message={n.notSupportedReason || t('Network unavailable')}
                />
              )}
            </>
          ),
          icon: <NetworkIcon key={n.chainId.toString()} id={n.chainId.toString()} size={28} />
        }
      }),
    [networks, balancePerNetwork, t]
  )

  const getToNetworkSelectValue = useMemo(() => {
    const network = networks.find((n) => Number(n.chainId) === toChainId)
    if (!network) return toNetworksOptions[0]

    return toNetworksOptions.filter((opt) => opt.value === String(network.chainId))[0]
  }, [networks, toChainId, toNetworksOptions])

  const handleChangeToToken = useCallback(
    ({ address: toSelectedTokenAddr }: SelectValue) => {
      const isSameAsFromToken =
        !!fromSelectedToken &&
        !!toChainId &&
        toSelectedTokenAddr === fromSelectedToken.address &&
        BigInt(toChainId) === fromSelectedToken.chainId

      swapAndBridgeDispatch({
        type: 'method',
        params: {
          method: 'updateForm',
          args: [
            {
              toSelectedTokenAddr,
              // Reset the from token if it's the same. undefined acts as "do nothing", null as reset
              fromSelectedToken: isSameAsFromToken ? null : undefined
            },
            { isToSelectionByUser: true }
          ]
        }
      })
    },
    [fromSelectedToken, toChainId, swapAndBridgeDispatch]
  )

  const handleAddToTokenByAddress = useCallback(
    (searchTerm: string) => {
      const isValidTokenAddress = isAddress(searchTerm)
      if (!isValidTokenAddress) return

      swapAndBridgeDispatch({
        type: 'method',
        params: { method: 'addToTokenByAddress', args: [searchTerm] }
      })
    },
    [swapAndBridgeDispatch]
  )

  const toAmount = useMemo(() => {
    if (
      !quote ||
      !quote.selectedRoute ||
      !quote?.toAsset?.decimals ||
      signAccountOpController?.estimation.status === EstimationStatus.Error
    )
      return '0'

    return formatUnits(quote.selectedRoute.toAmount, quote.toAsset.decimals)
  }, [quote, signAccountOpController?.estimation.status])

  const formattedToAmount = useMemo(() => {
    if (toAmount === '0') return '0'

    return `${formatDecimals(Number(toAmount), 'precise')}`
  }, [toAmount])

  const hasSelectedToToken =
    toTokenValue &&
    typeof toTokenValue === 'object' &&
    'symbol' in toTokenValue &&
    'isPending' in toTokenValue &&
    'pendingBalanceFormatted' in toTokenValue &&
    'balanceFormatted' in toTokenValue

  return (
    <ItemPanel style={spacings.pvSm}>
      <SwitchTokensButton
        onPress={handleSwitchFromAndToTokens}
        disabled={
          disabled ||
          switchTokensStatus === 'LOADING' ||
          updateQuoteStatus === 'LOADING' ||
          updateToTokenListStatus === 'LOADING'
        }
      />
      <View
        style={[flexbox.directionRow, flexbox.alignEnd, flexbox.justifySpaceBetween, spacings.mbMi]}
      >
        <Text appearance="secondaryText" fontSize={14} weight="medium" style={spacings.mbSm}>
          {t('You receive')}
        </Text>
        <View style={isWeb ? styles.networkColumn : undefined}>
          <Select
            setValue={handleSetToNetworkValue}
            containerStyle={{ ...spacings.mb0, width: isWeb ? '100%' : 150 }}
            options={toNetworksOptions}
            selectStyle={{ ...spacings.phMi, ...spacings.prTy }}
            size="sm"
            value={getToNetworkSelectValue}
            mode="bottomSheet"
            bottomSheetTitle={t('Receive token network')}
            testID="to-network-select"
            disabled={disabled}
          />
        </View>
      </View>
      <View style={styles.balanceRow}>
        {hasSelectedToToken && (
          <View
            style={[flexbox.directionRow, flexbox.alignCenter]}
            dataSet={createGlobalTooltipDataSet({
              id: 'to-token-balance-tooltip',
              content: t('Balance may be inaccurate'),
              hidden: !simulationFailed
            })}
          >
            <WalletIcon
              width={20}
              height={20}
              color={simulationFailed ? theme.warningDecorative : theme.tertiaryText}
            />
            <Text
              testID="max-available-amount"
              numberOfLines={1}
              fontSize={12}
              style={spacings.mlMi}
              weight="medium"
              appearance="tertiaryText"
              ellipsizeMode="tail"
              color={simulationFailed ? theme.warningDecorative : theme.tertiaryText}
            >
              {`${
                toTokenValue.isPending
                  ? toTokenValue.pendingBalanceFormatted
                  : toTokenValue.balanceFormatted
              } ${toTokenValue.symbol}`}
            </Text>
          </View>
        )}
        {!!quote?.selectedRoute && isReadyToDisplayAmounts && (
          <Text
            fontSize={12}
            color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
            weight="medium"
            testID="switch-currency-sab"
            style={{ marginLeft: 'auto' }}
          >
            {formatDecimals(quote.selectedRoute.outputValueInUsd || 0, 'price')}
          </Text>
        )}
      </View>
      <View style={styles.tokenRow}>
        <View style={flexbox.flex1}>
          <ToTokenSelect
            toTokenOptions={toTokenOptions}
            toTokenValue={toTokenValue}
            handleChangeToToken={handleChangeToToken}
            toTokenAmountSelectDisabled={disabled || toTokenAmountSelectDisabled}
            addToTokenByAddressStatus={swapAndBridgeCtrlStatuses.addToTokenByAddress}
            handleAddToTokenByAddress={handleAddToTokenByAddress}
            openProviderSettingsModal={openProviderSettingsModal}
          />
        </View>
        <View
          style={isWeb ? styles.amountColumn : [flexbox.flex1, { maxWidth: '40%' }]}
          pointerEvents="box-none"
        >
          {isReadyToDisplayAmounts ? (
            <Text
              fontSize={20}
              weight="medium"
              numberOfLines={1}
              ellipsizeMode="tail"
              appearance={
                formattedToAmount && formattedToAmount !== '0' ? 'primaryText' : 'secondaryText'
              }
              dataSet={createGlobalTooltipDataSet({
                id: 'to-amount',
                content: toAmount,
                hidden: formattedToAmount === '0'
              })}
              style={{ textAlign: 'right' }}
            >
              {formattedToAmount}
            </Text>
          ) : (
            <SkeletonLoader
              appearance="primaryBackground"
              width={100}
              height={32}
              style={{ marginLeft: 'auto' }}
            />
          )}
        </View>
      </View>
    </ItemPanel>
  )
}

export default memo(ToToken)
