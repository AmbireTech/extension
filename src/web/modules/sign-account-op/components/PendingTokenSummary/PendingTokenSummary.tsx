import { formatUnits } from 'ethers'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import WarningFilledIcon from '@common/assets/svg/WarningFilledIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BigIntMath } from '@common/utils/bigint'
import { getTokenId } from '@web/utils/token'

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
    if (token.simulationAmount! < 0) return theme.errorDecorative
    if (token.simulationAmount! > 0) return theme.successDecorative

    return theme.secondaryText
  }, [token.simulationAmount, theme])

  const suspiciousTokenTooltipContent = useMemo(() => {
    const reason = token.flags.suspectedType
    if (!reason) return null

    if (reason === 'suspected') return t('This may be a suspicious token.')

    return null
  }, [token.flags.suspectedType, t])

  return (
    <View style={[styles.container, !hasBottomSpacing && spacings.mb0]}>
      <View style={spacings.mrTy}>
        <TokenIcon
          width={20}
          height={20}
          chainId={chainId}
          address={token.address}
          withNetworkIcon={false}
        />
      </View>
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
        <Text fontSize={16} weight="medium">
          {` ${token.symbol}`}
        </Text>
        {!!priceInUsd && <Text fontSize={16} weight="medium">{` ($${priceInUsd}) `}</Text>}
      </Text>
      {token.flags.suspectedType && (
        <View
          // @ts-ignore
          style={[spacings.mlMi, { cursor: 'pointer' }]}
          dataSet={createGlobalTooltipDataSet({
            id: `token-amount-${tokenId}`,
            content: suspiciousTokenTooltipContent ?? undefined
          })}
        >
          <WarningFilledIcon />
        </View>
      )}
    </View>
  )
}

export default React.memo(PendingTokenSummary)
