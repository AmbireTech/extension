import { formatUnits, ZeroAddress } from 'ethers'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import type usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'

export type PrivacyPoolsTokenOption = SelectValue & {
  // The pool the option belongs to. Every action is scoped to it, since each chain has its own
  // pools and its own entrypoint.
  chainId: string
  tokenAddress: string
  isNative: boolean
  symbol: string
  decimals: number
  // Raw units, so the form can validate what was typed against what is actually there: the
  // approved private balance.
  availableAmount: bigint
}

/**
 * Options span every supported chain at once, so the same token on two chains would collide on a
 * plain address key - and picking the wrong one would prove against the wrong pool. The chain is therefore part of an option's identity, not just a label on it.
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
  availableAmount
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
}): PrivacyPoolsTokenOption => ({
  value: getTokenOptionValue(chainId, tokenAddress),
  chainId,
  tokenAddress,
  isNative,
  symbol,
  decimals,
  availableAmount,
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
 * The token dropdown of the Send form: what the pools hold for this recovery phrase and the
 * association set has approved. Pending notes are deliberately absent: they cannot be withdrawn
 * privately at all.
 */
const usePrivacyPoolsTokens = ({
  tokenBalances,
  getNetworkName
}: Pick<ReturnType<typeof usePrivacyPools>, 'tokenBalances' | 'getNetworkName'>) => {
  const { t } = useTranslation()

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
            note: t('ready to send'),
            availableAmount: balance.approvedAmount
          })
        ),
    [tokenBalances, getNetworkName, t]
  )

  return { withdrawTokens }
}

export default usePrivacyPoolsTokens
