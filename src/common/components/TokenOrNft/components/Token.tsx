import { formatUnits, MaxUint256 } from 'ethers'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import formatDecimals from '@common/utils/formatDecimals'

interface Props {
  amount: bigint
  textSize?: number
  tokenInfo?: {
    decimals: number
    symbol: string
  }
  network: Network
  address: string
  sizeMultiplierSize?: number
}

const InnerToken: FC<Props> = ({
  address,
  amount,
  textSize = 16,
  tokenInfo,
  network,
  sizeMultiplierSize = 1
}) => {
  const { t } = useTranslation()
  const openExplorer = useCallback(
    () => Linking.openURL(`${network.explorerUrl}/address/${address}`),
    [address, network.explorerUrl]
  )

  const shouldDisplayUnlimitedAmount = useMemo(() => {
    const isUnlimitedByPermit2 = amount.toString(16).toLowerCase() === 'f'.repeat(40)
    const isMaxUint256 = amount === MaxUint256
    return isUnlimitedByPermit2 || isMaxUint256
  }, [amount])

  return (
    <>
      {BigInt(amount) > BigInt(0) ? (
        <Text fontSize={textSize} weight="medium" appearance="primaryText">
          {shouldDisplayUnlimitedAmount ? (
            <Text style={spacings.mrTy} appearance="warningText">
              {t('unlimited')}
            </Text>
          ) : (
            <>
              {formatDecimals(Number(formatUnits(amount, tokenInfo?.decimals || 1)))}{' '}
              {!tokenInfo?.decimals && (
                <Text
                  fontSize={textSize}
                  weight="medium"
                  appearance="primaryText"
                  style={{ maxWidth: '100%' }}
                >
                  {t('units of')}
                </Text>
              )}
            </>
          )}
        </Text>
      ) : null}
      <Pressable style={{ ...flexbox.directionRow, ...flexbox.alignCenter }} onPress={openExplorer}>
        <TokenIcon
          width={24 * sizeMultiplierSize}
          height={24 * sizeMultiplierSize}
          networkId={network.id}
          address={address}
          withNetworkIcon={false}
        />
        <Text fontSize={textSize} weight="medium" appearance="primaryText" style={spacings.mhMi}>
          {tokenInfo?.symbol || t('unknown token')}
        </Text>
        <OpenIcon width={14} height={14} />
      </Pressable>
    </>
  )
}

export default memo(InnerToken)
