import { formatUnits, ZeroAddress } from 'ethers'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import { getPrivacyPoolsTokenId } from '@ambire-common/consts/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import type usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'

export type PrivacyPoolsTokenOption = SelectValue & {
  // Each chain has its own pools and entrypoint
  chainId: string
  tokenAddress: string
  isNative: boolean
  symbol: string
  decimals: number
  // The approved balance in raw units, for validating the typed amount
  availableAmount: bigint
}

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
  // Translated by the caller
  note: string
  networkName: string
  availableAmount: bigint
}): PrivacyPoolsTokenOption => ({
  value: getPrivacyPoolsTokenId(chainId, tokenAddress),
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
      // Tells same-symbol entries on different networks apart
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

/** Send form token options: approved balances only, as pending ones cannot be withdrawn. */
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
