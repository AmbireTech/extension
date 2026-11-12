import { formatUnits } from 'ethers'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import { getPrivacyPoolsDepositId } from '@ambire-common/consts/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import type usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

export type PrivacyPoolsTokenOption = SelectValue & {
  // Each chain has its own pools and entrypoint
  chainId: string
  tokenAddress: string
  isNative: boolean
  symbol: string
  decimals: number
  // The deposit it sends from, as a send spends exactly one - see
  // `PrivacyPoolsSendableDeposit.number`
  depositNumber: number
  // What can be sent now in raw units - what is left in the deposit less what transfers on their
  // way take out - for validating the typed amount
  availableAmount: bigint
}

const selectSendableDeposits = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.sendableDeposits

const getTokenOption = ({
  chainId,
  tokenAddress,
  isNative,
  symbol,
  decimals,
  depositNumber,
  title,
  note,
  networkName,
  availableAmount
}: {
  chainId: string
  tokenAddress: string
  isNative: boolean
  symbol: string
  decimals: number
  depositNumber: number
  // Translated by the caller
  title: string
  note: string
  networkName: string
  availableAmount: bigint
}): PrivacyPoolsTokenOption => ({
  value: getPrivacyPoolsDepositId(chainId, tokenAddress, depositNumber),
  chainId,
  tokenAddress,
  isNative,
  symbol,
  decimals,
  depositNumber,
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
          {title}
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
 * Send form token options: one per deposit, as a send spends exactly one, and only approved ones,
 * as pending ones cannot be sent.
 */
const usePrivacyPoolsTokens = ({
  getNetworkName
}: Pick<ReturnType<typeof usePrivacyPools>, 'getNetworkName'>) => {
  const { t } = useTranslation()
  const { state: sendableDeposits } = useController(
    'PrivacyPoolsController',
    selectSendableDeposits
  )

  const withdrawTokens: PrivacyPoolsTokenOption[] = useMemo(
    () =>
      Object.entries(sendableDeposits || {}).flatMap(([chainId, deposits]) =>
        deposits.map((deposit) =>
          getTokenOption({
            chainId,
            tokenAddress: deposit.tokenAddress,
            isNative: deposit.isNative,
            symbol: deposit.symbol,
            decimals: deposit.decimals,
            depositNumber: deposit.number,
            title: t('{{symbol}} (deposit #{{number}})', {
              symbol: deposit.symbol,
              number: deposit.number
            }),
            networkName: getNetworkName(chainId),
            note: t('ready to send'),
            availableAmount: deposit.availableAmount
          })
        )
      ),
    [sendableDeposits, getNetworkName, t]
  )

  return { withdrawTokens }
}

export default usePrivacyPoolsTokens
