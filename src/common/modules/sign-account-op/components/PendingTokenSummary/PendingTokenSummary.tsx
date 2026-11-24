import { formatUnits, ZeroAddress } from 'ethers'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import useAddressActions from '@common/components/HumanizerAddress/components/BaseAddress/useAddressActions'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { BigIntMath } from '@common/utils/bigint'
import { getTokenId } from '@common/utils/token'

import getStyles from './styles'

interface Props {
  token: TokenResult
  chainId: bigint | undefined
  hasBottomSpacing?: boolean
}
const PendingTokenSummary = ({ token, chainId, hasBottomSpacing = true }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const tokenId = getTokenId(token)
  const { network, handleOpenExplorer } = useAddressActions({
    address: token.address,
    chainId,
    isToken: true
  })
  const canOpenExplorer =
    !!network?.explorerUrl || (token.address === ZeroAddress && !!network?.nativeAssetId)
  const { formattedAmount, fullAmount } = useMemo(() => {
    if (token.simulationAmount === undefined || token.decimals === undefined) {
      return {
        formattedAmount: 0,
        fullAmount: 0
      }
    }
    const numericAmount = parseFloat(
      formatUnits(BigIntMath.abs(token.simulationAmount!), token.decimals)
    )
    return {
      formattedAmount: formatDecimals(numericAmount, 'amount'),
      fullAmount: numericAmount
    }
  }, [token.simulationAmount, token?.decimals])

  const priceInUsd = useMemo(() => {
    if (!token.decimals) return null

    const usdPrice = token.priceIn.find(
      ({ baseCurrency }: { baseCurrency: string }) => baseCurrency === 'usd'
    )?.price

    if (!usdPrice) return null

    const value = Math.abs(usdPrice * Number(formatUnits(token.simulationAmount!, token.decimals)))

    return formatDecimals(value)
  }, [token])

  const amountToSendSign = useMemo(() => {
    if (token.simulationAmount! < 0) return '-'
    if (token.simulationAmount! > 0) return '+'

    return ''
  }, [token.simulationAmount])

  const amountToSendTextColor = useMemo(() => {
    if (token.simulationAmount! < 0) return theme.error300
    if (token.simulationAmount! > 0) return theme.success400

    return theme.secondaryText
  }, [token.simulationAmount, theme])

  const suspiciousTokenTooltipContent = useMemo(() => {
    const reason = token.flags.suspectedType
    if (!reason) return null

    if (reason === 'suspected') return t('This may be a suspicious token.')

    return null
  }, [token.flags.suspectedType, t])

  const tokenIcon = useMemo(
    () =>
      token.flags.onGasTank ? (
        <View
          style={[
            {
              width: 24,
              height: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.neutral200
            },
            common.borderRadiusPrimary
          ]}
        >
          <GasTankIcon width={14} height={14} color={theme.primaryAccent} />
        </View>
      ) : (
        <TokenIcon
          width={20}
          height={20}
          withContainer
          containerHeight={24}
          containerWidth={24}
          chainId={chainId}
          address={token.address}
          withNetworkIcon={false}
        />
      ),
    [chainId, theme.neutral200, theme.primaryAccent, token.address, token.flags.onGasTank]
  )
  const suspiciousTokenWarning = useMemo(
    () =>
      token.flags.suspectedType ? (
        <View
          // @ts-ignore
          style={[spacings.mlMi, { cursor: 'pointer' }]}
          dataSet={createGlobalTooltipDataSet({
            id: `token-amount-${tokenId}`,
            content: suspiciousTokenTooltipContent ?? undefined
          })}
        >
          <WarningIcon />
        </View>
      ) : null,
    [suspiciousTokenTooltipContent, token.flags.suspectedType, tokenId]
  )

  if (isMobile) {
    return (
      <View
        style={[
          styles.container,
          flexbox.justifySpaceBetween,
          { width: '100%' },
          !hasBottomSpacing && spacings.mb0
        ]}
      >
        <HoverablePressable
          onPress={handleOpenExplorer}
          disabled={!canOpenExplorer}
          accessibilityRole={canOpenExplorer ? 'link' : undefined}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter, { minWidth: 0 }]}>
            <View style={spacings.mrTy}>{tokenIcon}</View>
            <Text fontSize={16} weight="medium" appearance="secondaryText">
              {token.symbol}
            </Text>
          </View>
        </HoverablePressable>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlTy]}>
          <Text
            selectable
            fontSize={16}
            weight="medium"
            dataSet={{
              tooltipId: `${amountToSendSign}token-summary-${tokenId}`
            }}
          >
            <Text
              weight="medium"
              // @ts-ignore
              style={{ cursor: 'pointer' }}
              color={amountToSendTextColor}
              dataSet={createGlobalTooltipDataSet({
                id: `${amountToSendSign}token-amount-${tokenId}`,
                content: String(fullAmount)
              })}
            >{`${amountToSendSign}${formattedAmount}`}</Text>
            {!!priceInUsd && (
              <Text
                fontSize={16}
                weight="medium"
                appearance="secondaryText"
              >{` ($${priceInUsd})`}</Text>
            )}
          </Text>
          {suspiciousTokenWarning}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, !hasBottomSpacing && spacings.mb0]}>
      <View style={spacings.mrTy}>{tokenIcon}</View>
      <Text
        selectable
        fontSize={16}
        weight="medium"
        dataSet={{
          tooltipId: `${amountToSendSign}token-summary-${tokenId}`
        }}
      >
        <Text
          weight="medium"
          // @ts-ignore
          style={{ cursor: 'pointer' }}
          color={amountToSendTextColor}
          dataSet={createGlobalTooltipDataSet({
            id: `${amountToSendSign}token-amount-${tokenId}`,
            content: String(fullAmount)
          })}
        >{`${amountToSendSign}${formattedAmount}`}</Text>
      </Text>
      <HoverablePressable
        onPress={handleOpenExplorer}
        disabled={!canOpenExplorer}
        accessibilityRole={canOpenExplorer ? 'link' : undefined}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlMi]}>
          <Text fontSize={16} weight="medium" appearance="secondaryText">
            {token.symbol}
          </Text>
          {canOpenExplorer && (
            <View style={[{ marginLeft: 2, marginTop: -8 }, flexbox.center]}>
              <OpenIcon color={theme.secondaryText} width={11} height={11} />
            </View>
          )}
        </View>
      </HoverablePressable>
      {!!priceInUsd && (
        <Text
          selectable
          fontSize={16}
          weight="medium"
          appearance="secondaryText"
          style={spacings.mlMi}
        >{`($${priceInUsd})`}</Text>
      )}
      {suspiciousTokenWarning}
    </View>
  )
}

export default React.memo(PendingTokenSummary)
