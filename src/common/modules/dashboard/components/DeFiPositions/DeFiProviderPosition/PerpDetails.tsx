import { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, View } from 'react-native'

import { Position } from '@ambire-common/libs/defiPositions/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const PILL_HEIGHT = 22
const PILL_RADIUS = 6

const TradePair: FC<{ baseSymbol: string; quoteSymbol: string }> = ({
  baseSymbol,
  quoteSymbol
}) => (
  <Text fontSize={14} weight="medium" appearance="secondaryText" style={spacings.mrTy}>
    {baseSymbol}/{quoteSymbol}
  </Text>
)

const SidePill: FC<{ side: string; isLong: boolean }> = ({ side, isLong }) => {
  const { theme } = useTheme()
  const color = isLong ? theme.successText : theme.errorText
  const decorative = isLong ? theme.successDecorative : theme.errorDecorative

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phMi,
        spacings.mrTy,
        {
          height: PILL_HEIGHT,
          borderRadius: PILL_RADIUS,
          backgroundColor: `${String(decorative)}1F`
        }
      ]}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          marginRight: 5,
          backgroundColor: color
        }}
      />
      <Text fontSize={12} weight="medium" color={color}>
        {side}
      </Text>
    </View>
  )
}

const LeverageChip: FC<{ value: string }> = ({ value }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.center,
        spacings.phMi,
        {
          height: PILL_HEIGHT,
          borderRadius: PILL_RADIUS,
          backgroundColor: theme.secondaryBackground,
          borderWidth: 1,
          borderColor: theme.secondaryBorder
        }
      ]}
    >
      <Text fontSize={12} weight="medium" appearance="secondaryText">
        {value}
      </Text>
    </View>
  )
}

const PnlReadout: FC<{ label: string; value: string; isPositive: boolean }> = ({
  label,
  value,
  isPositive
}) => {
  const { theme } = useTheme()
  const color: ColorValue = isPositive ? theme.successText : theme.errorText

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      <Text fontSize={11} appearance="secondaryText" style={spacings.mrMi}>
        {label}
      </Text>
      <Text fontSize={14} weight="semiBold" color={color} style={spacings.mlMi}>
        {value}
      </Text>
    </View>
  )
}

const PerpDetails: FC<{
  additionalData: Position['additionalData']
}> = ({ additionalData }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { baseToken, quoteToken, side, leverage, pnlUsdValue } = additionalData

  const perpDetails = useMemo(() => {
    const hasTradePair = !!baseToken?.symbol && !!quoteToken?.symbol

    const normalizedSide =
      typeof side === 'string' && side.length
        ? `${side.charAt(0).toUpperCase()}${side.slice(1).toLowerCase()}`
        : null

    const hasPnl =
      pnlUsdValue !== undefined && pnlUsdValue !== null && !Number.isNaN(Number(pnlUsdValue))
    const hasLeverage =
      leverage !== undefined && leverage !== null && !Number.isNaN(Number(leverage))

    if (!hasTradePair || !normalizedSide || (!hasLeverage && !hasPnl)) return null

    const pnl = hasPnl ? Number(pnlUsdValue) : 0
    const isPositivePnl = pnl >= 0
    const pnlFormatted = `${isPositivePnl ? '+' : ''}${formatDecimals(pnl, 'value')}`

    return {
      hasTradePair,
      baseSymbol: baseToken?.symbol as string,
      quoteSymbol: quoteToken?.symbol as string,
      normalizedSide,
      isLong: normalizedSide?.toLowerCase() === 'long',
      hasLeverage,
      leverageFormatted: hasLeverage ? `${leverage}×` : '',
      hasPnl,
      isPositivePnl,
      pnlFormatted
    }
  }, [baseToken, quoteToken, side, leverage, pnlUsdValue])

  if (!perpDetails) return null

  const {
    baseSymbol,
    quoteSymbol,
    normalizedSide,
    hasTradePair,
    hasPnl,
    isLong,
    leverageFormatted,
    pnlFormatted,
    isPositivePnl,
    hasLeverage
  } = perpDetails

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        flexbox.wrap,
        spacings.phSm,
        spacings.pbSm,
        spacings.ptMi,
        { borderTopWidth: 1, borderTopColor: theme.secondaryBorder }
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap]}>
        {hasTradePair && <TradePair baseSymbol={baseSymbol} quoteSymbol={quoteSymbol} />}
        {!!normalizedSide && <SidePill side={normalizedSide} isLong={isLong} />}
        {hasLeverage && <LeverageChip value={leverageFormatted} />}
      </View>
      {hasPnl && <PnlReadout label={t('P&L')} value={pnlFormatted} isPositive={isPositivePnl} />}
    </View>
  )
}

export default PerpDetails
