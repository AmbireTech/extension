import { formatUnits, ZeroAddress } from 'ethers'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import { getPrivacyPoolsChainConfig } from '@ambire-common/consts/privacyPools'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'

export type PrivacyPoolsTokenOption = SelectValue & {
  // The pool the option belongs to. Every action is scoped to it, since each chain has its own
  // pools and its own entrypoint.
  chainId: string
  tokenAddress: string
  isNative: boolean
  symbol: string
  decimals: number
  // Raw units, so the form can validate what was typed against what is actually there: the public
  // balance for a deposit, the approved private balance for a withdrawal.
  availableAmount: bigint
  // The per-deposit ceiling the pool operator applies, or null for withdrawals where none exists.
  maxDeposit: bigint | null
}

/**
 * Options span every supported chain at once, so the same token on two chains would collide on a
 * plain address key - and picking the wrong one would deposit into, or prove against, the wrong
 * pool. The chain is therefore part of an option's identity, not just a label on it.
 */
const getTokenOptionValue = (chainId: string, tokenAddress: string) =>
  `${chainId}:${tokenAddress.toLowerCase()}`

const getTokenOption = ({
  chainId,
  tokenAddress,
  isNative,
  symbol,
  decimals,
  note,
  networkName,
  availableAmount,
  maxDeposit = null
}: {
  chainId: string
  tokenAddress: string
  isNative: boolean
  symbol: string
  decimals: number
  // Already translated by the caller, since this is not a component
  note: string
  networkName: string
  availableAmount: bigint
  maxDeposit?: bigint | null
}): PrivacyPoolsTokenOption => ({
  value: getTokenOptionValue(chainId, tokenAddress),
  chainId,
  tokenAddress,
  isNative,
  symbol,
  decimals,
  availableAmount,
  maxDeposit,
  extraSearchProps: { symbol, address: tokenAddress, network: networkName },
  icon: (
    <TokenIcon
      chainId={BigInt(chainId)}
      address={tokenAddress}
      withContainer
      // The list spans every supported network, so the badge is what tells two same-symbol entries
      // apart at a glance.
      withNetworkIcon
      containerWidth={32}
      containerHeight={32}
      width={28}
      height={28}
    />
  ),
  label: (
    <>
      <View style={flexbox.flex1}>
        <Text fontSize={16} weight="medium" numberOfLines={1}>
          {symbol}
        </Text>
        <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
          {`${networkName} · ${note}`}
        </Text>
      </View>
      <Text
        fontSize={14}
        weight="number_regular"
        appearance="secondaryText"
        numberOfLines={1}
        style={spacings.mlSm}
      >
        {formatDecimals(Number(formatUnits(availableAmount, decimals)), 'amount')}
      </Text>
    </>
  )
})

/**
 * The token dropdowns for both forms:
 * - `depositTokens` - what the pools accept, across every supported network, with the account's
 *   public balance as the amount, since that is what a deposit spends
 * - `withdrawTokens` - what the pools hold for this recovery phrase and the association set has
 *   approved. Pending notes are deliberately absent: they cannot be withdrawn privately at all
 */
const usePrivacyPoolsTokens = () => {
  const { t } = useTranslation()
  const { networkRows, tokenBalances, getNetworkName } = usePrivacyPools()
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')

  // Gas Tank and rewards entries are portfolio-level virtual balances - they don't exist on chain
  // as spendable tokens, so they cannot fund a deposit.
  const publicAmounts = useMemo(() => {
    const byKey: { [key: string]: bigint } = {}

    ;(portfolio?.tokens || []).forEach((token) => {
      if (token.flags.onGasTank || token.flags.rewardsType) return

      byKey[getTokenOptionValue(token.chainId.toString(), token.address)] = getTokenAmount(token)
    })

    return byKey
  }, [portfolio?.tokens])

  const depositTokens: PrivacyPoolsTokenOption[] = useMemo(
    () =>
      networkRows.flatMap((row) => {
        const assets = getPrivacyPoolsChainConfig(BigInt(row.chainId))?.assets || []

        return assets.map((asset) =>
          getTokenOption({
            chainId: row.chainId,
            tokenAddress: asset.address,
            isNative: asset.isNative,
            symbol: asset.symbol,
            decimals: asset.decimals,
            networkName: row.networkName,
            note: t('in your wallet'),
            availableAmount: publicAmounts[getTokenOptionValue(row.chainId, asset.address)] || 0n,
            maxDeposit: asset.maxDeposit
          })
        )
      }),
    [networkRows, publicAmounts, t]
  )

  const withdrawTokens: PrivacyPoolsTokenOption[] = useMemo(
    () =>
      tokenBalances
        .filter(({ balance }) => balance.approvedAmount > 0n)
        .map(({ chainId, balance }) =>
          getTokenOption({
            chainId,
            tokenAddress: balance.tokenAddress,
            isNative: balance.isNative || balance.tokenAddress === ZeroAddress,
            symbol: balance.symbol,
            decimals: balance.decimals,
            networkName: getNetworkName(chainId),
            note: t('ready to withdraw'),
            availableAmount: balance.approvedAmount
          })
        ),
    [tokenBalances, getNetworkName, t]
  )

  return { depositTokens, withdrawTokens }
}

export default usePrivacyPoolsTokens
