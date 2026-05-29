import { formatUnits, MaxUint256, ZeroAddress } from 'ethers'
import { nanoid } from 'nanoid'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, View } from 'react-native'

import { getCoinGeckoTokenUrl } from '@ambire-common/consts/coingecko'
import { Network } from '@ambire-common/interfaces/network'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import OpenIcon from '@common/assets/svg/OpenIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
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
  chainId,
  tokenIconContainerSize
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const tokenIconSize = tokenIconContainerSize
    ? Math.max(tokenIconContainerSize - 4, 0)
    : 24 * sizeMultiplierSize
  const canOpenExplorer =
    !!network?.explorerUrl || (address === ZeroAddress && !!network?.nativeAssetId)

  const openExplorer = useCallback(async () => {
    if (!network) return

    const targetUrl =
      address === ZeroAddress && network?.nativeAssetId
        ? // Exception for native tokens, they don't have a block explorer URLs
          getCoinGeckoTokenUrl(network.nativeAssetId)
        : `${network?.explorerUrl}/address/${address}`

    await Linking.openURL(targetUrl)
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
            fontSize={textSize}
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
            {}
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
      <Pressable
        style={{ ...flexbox.directionRow, ...flexbox.alignCenter, marginRight }}
        onPress={canOpenExplorer ? openExplorer : undefined}
        accessibilityRole={canOpenExplorer ? 'link' : undefined}
      >
        {({ hovered }: any) => (
          <>
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
            <Text
              fontSize={textSize}
              weight="medium"
              appearance="primaryText"
              underline={canOpenExplorer && hovered}
              style={spacings.mlMi}
            >
              {tokenInfo?.symbol || (
                <HumanizerAddress
                  chainId={chainId}
                  fontSize={textSize}
                  address={address}
                  hideLogo
                />
              )}
            </Text>
            {canOpenExplorer && (
              <View style={[{ marginLeft: 2, marginTop: -8 }, flexbox.center]}>
                <OpenIcon
                  color={hovered ? theme.primaryText : theme.secondaryText}
                  width={11}
                  height={11}
                />
              </View>
            )}
          </>
        )}
      </Pressable>
    </>
  )
}

export default memo(InnerToken)
