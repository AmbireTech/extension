import { formatUnits, MaxUint256, ZeroAddress } from 'ethers'
import { nanoid } from 'nanoid'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, View } from 'react-native'

import { getCoinGeckoTokenUrl } from '@ambire-common/consts/coingecko'
import { Network } from '@ambire-common/interfaces/network'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  amount: bigint
  textSize?: number
  tokenInfo?: {
    decimals: number
    symbol: string
  }
  network?: Network
  address: string
  sizeMultiplierSize?: number
  marginRight: number
  hideLinks?: boolean
  chainId: bigint
  tokenIconContainerSize?: number
}

const InnerToken: FC<Props> = ({
  address,
  amount,
  textSize = 16,
  tokenInfo,
  network,
  sizeMultiplierSize = 1,
  marginRight,
  hideLinks = false,
  chainId,
  tokenIconContainerSize
}) => {
  const { t } = useTranslation()
  const tokenIconSize = tokenIconContainerSize
    ? Math.max(tokenIconContainerSize - 4, 0)
    : 24 * sizeMultiplierSize

  const openExplorer = useCallback(async () => {
    const targetUrl =
      address === ZeroAddress && network?.nativeAssetId
        ? // Exception for native tokens, they don't have a block explorer URLs
          getCoinGeckoTokenUrl(network.nativeAssetId)
        : `${network?.explorerUrl}/address/${address}`

    if (network) await Linking.openURL(targetUrl)
  }, [network, address])

  const shouldDisplayUnlimitedAmount = useMemo(() => {
    const isUnlimitedByPermit2 = amount.toString(16).toLowerCase() === 'f'.repeat(40)
    const isMaxUint256 = amount === MaxUint256
    return isUnlimitedByPermit2 || isMaxUint256
  }, [amount])

  const { formattedAmount, fullAmount } = useMemo(() => {
    if (tokenInfo?.decimals === undefined || amount === undefined) {
      return {
        formattedAmount: 0,
        fullAmount: 0
      }
    }

    const numericAmount = parseFloat(formatUnits(amount, tokenInfo.decimals))

    return {
      formattedAmount: formatDecimals(numericAmount, 'amount'),
      fullAmount: numericAmount
    }
  }, [amount, tokenInfo?.decimals])

  const shouldDisplayALotOf = useMemo(() => fullAmount >= 10_000_000_000, [fullAmount])
  const amountTooltipId = useMemo(
    () =>
      shouldDisplayUnlimitedAmount
        ? `${address}-unlimited-amount-${nanoid(6)}`
        : `${address}-${fullAmount}-balance-${nanoid(6)}`,
    [address, fullAmount, shouldDisplayUnlimitedAmount]
  )

  return (
    <>
      {BigInt(amount) > BigInt(0) ? (
        <Text
          fontSize={textSize}
          weight="medium"
          appearance="primaryText"
          style={{ maxWidth: '100%', ...(isMobile ? spacings.mrMi : {}) }}
        >
          <Text
            weight={shouldDisplayUnlimitedAmount ? undefined : 'medium'}
            appearance={
              shouldDisplayUnlimitedAmount || shouldDisplayALotOf ? 'warningText' : 'primaryText'
            }
            dataSet={createGlobalTooltipDataSet({
              id: amountTooltipId,
              content: String(fullAmount)
            })}
            style={spacings.mrMi}
          >
            {/* eslint-disable-next-line no-nested-ternary */}
            {shouldDisplayUnlimitedAmount
              ? t('unlimited')
              : shouldDisplayALotOf
                ? t('a lot of')
                : formattedAmount}
          </Text>
          {!shouldDisplayUnlimitedAmount && !shouldDisplayALotOf && !tokenInfo?.decimals && (
            <Text
              fontSize={textSize}
              weight="medium"
              appearance="primaryText"
              style={{ maxWidth: '100%', ...spacings.mrTy }}
            >
              {t('units of')}
            </Text>
          )}
        </Text>
      ) : null}
      {hideLinks ? (
        <View style={{ ...flexbox.directionRow, ...flexbox.alignCenter, marginRight }}>
          <TokenIcon
            width={tokenIconSize}
            height={tokenIconSize}
            withContainer={!!tokenIconContainerSize}
            containerWidth={tokenIconContainerSize}
            containerHeight={tokenIconContainerSize}
            chainId={network?.chainId}
            address={address}
            withNetworkIcon={false}
          />
          <Text fontSize={textSize} weight="medium" appearance="primaryText" style={spacings.mlMi}>
            {tokenInfo?.symbol || (
              <HumanizerAddress
                chainId={chainId}
                fontSize={textSize}
                address={address}
                hideLinks={hideLinks}
              />
            )}
          </Text>
        </View>
      ) : (
        <Pressable
          style={{ ...flexbox.directionRow, ...flexbox.alignCenter, marginRight }}
          onPress={openExplorer}
        >
          <TokenIcon
            width={tokenIconSize}
            height={tokenIconSize}
            withContainer={!!tokenIconContainerSize}
            containerWidth={tokenIconContainerSize}
            containerHeight={tokenIconContainerSize}
            chainId={network?.chainId}
            address={address}
            withNetworkIcon={false}
          />
          <Text fontSize={textSize} weight="medium" appearance="primaryText" style={spacings.mhMi}>
            {tokenInfo?.symbol || (
              <HumanizerAddress
                chainId={chainId}
                fontSize={textSize}
                address={address}
                hideLinks={hideLinks}
                hideLogo
              />
            )}
          </Text>
        </Pressable>
      )}
    </>
  )
}

export default memo(InnerToken)
