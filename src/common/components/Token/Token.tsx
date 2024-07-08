import { formatUnits, MaxUint256, ZeroAddress } from 'ethers'
import React, { FC, memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { getTokenInfo } from '@ambire-common/libs/humanizer/utils'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import formatDecimals from '@common/utils/formatDecimals'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'

interface Props {
  address: string
  amount: bigint
  sizeMultiplierSize: number
  textSize: number
  network: Network
}

const Token: FC<Props> = ({ amount, address, sizeMultiplierSize, textSize, network }) => {
  const marginRight = SPACING_TY * sizeMultiplierSize
  const shouldDisplayUnlimitedAmount = useMemo(() => {
    const isUnlimitedByPermit2 = amount.toString(16).toLowerCase() === 'f'.repeat(40)
    const isMaxUint256 = amount === MaxUint256
    return isUnlimitedByPermit2 || isMaxUint256
  }, [amount])

  const { t } = useTranslation()
  const [fetchedFromCena, setFetchedFromCena] = useState(null)
  const { accountPortfolio } = usePortfolioControllerState()
  const infoFromCurrentBalances = useMemo(
    () =>
      accountPortfolio?.tokens?.find(
        (token) => token.address.toLowerCase() === address.toLowerCase()
      ),
    [accountPortfolio, address]
  )
  const nativeTokenInfo = useMemo(
    () =>
      address === ZeroAddress && {
        symbol: network.nativeAssetSymbol,
        decimals: 18
      },
    [address, network]
  )
  useEffect(() => {
    if (!infoFromCurrentBalances && !nativeTokenInfo)
      getTokenInfo({ networkId: network.id, accountAddr: ZeroAddress }, address, {
        fetch,
        network
      })
        .then((r) => setFetchedFromCena(r?.value))
        .catch((e) => console.error(e))
  }, [nativeTokenInfo, infoFromCurrentBalances, address, network])

  const tokenInfo: { decimals?: number; symbol?: string } = useMemo(
    () => infoFromCurrentBalances || nativeTokenInfo || fetchedFromCena || {},
    [infoFromCurrentBalances, nativeTokenInfo, fetchedFromCena]
  )

  const openExplorer = useMemo(
    () => () => Linking.openURL(`${network.explorerUrl}/address/${address}`),
    [address, network.explorerUrl]
  )

  return (
    <View style={{ ...flexbox.directionRow, ...flexbox.alignCenter, marginRight }}>
      {BigInt(amount) > BigInt(0) ? (
        <Text
          fontSize={textSize}
          weight="medium"
          appearance="primaryText"
          style={{ maxWidth: '100%' }}
        >
          {shouldDisplayUnlimitedAmount ? (
            <Text appearance="warningText">{t('unlimited')}</Text>
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
      <Pressable
        style={{ ...spacings.mlMi, ...flexbox.directionRow, ...flexbox.alignCenter }}
        onPress={openExplorer}
      >
        <TokenIcon
          width={24 * sizeMultiplierSize}
          height={24 * sizeMultiplierSize}
          networkId={network.id}
          address={address}
          withNetworkIcon={false}
          containerStyle={{ marginRight: marginRight / 2 }}
        />
        <Text fontSize={textSize} weight="medium" appearance="primaryText" style={spacings.mrMi}>
          {tokenInfo?.symbol || t('unknown token')}
        </Text>
        <OpenIcon width={14} height={14} />
      </Pressable>
    </View>
  )
}

export default memo(Token)
