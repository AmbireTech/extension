import { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import OpenIcon from '@common/assets/svg/OpenIcon'
import CopyText from '@common/components/CopyText'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

import TokenDetailsTitle from '../Title'

type Props = {
  token: TokenResult
}

type Row = {
  id?: 'chain' | 'address'
  label: string
  value: string | number | bigint
}

const Label = memo(({ label }: { label: string }) => {
  return (
    <Text
      weight="medium"
      fontSize={14}
      appearance="secondaryText"
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {label}
    </Text>
  )
})

const Row = memo(
  ({
    label,
    value,
    id,
    isLast,
    chainId
  }: Row & {
    isLast: boolean
    chainId: bigint
  }) => {
    const networks = useController('NetworksController', (state) => state.networks).state
    const networkData = networks.find((net) => net.chainId === chainId)
    const [bindOpenAnim, openAnimStyle] = useHover({ preset: 'opacityInverted' })

    const valueFormatted = useMemo(() => {
      if (id === 'chain') {
        return networkData?.name || value.toString()
      }

      if (id === 'address') {
        return shortenAddress(value.toString(), 13)
      }

      return value.toString()
    }, [id, value, networkData?.name])

    return (
      <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, !isLast && spacings.mbSm]}>
        <Label label={label} />

        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          {id === 'chain' && <NetworkIcon id={value.toString()} size={20} style={spacings.mrTy} />}
          <Label label={valueFormatted} />
          {id === 'address' && (
            <>
              {!!networkData?.explorerUrl && (
                <AnimatedPressable
                  {...bindOpenAnim}
                  style={[openAnimStyle, spacings.mlTy]}
                  onPress={async () => {
                    await openInTab({ url: `${networkData.explorerUrl}/address/${value}` })
                  }}
                >
                  <OpenIcon width={20} height={20} />
                </AnimatedPressable>
              )}
              <CopyText iconSize={20} text={value.toString()} style={spacings.mlMi} />
            </>
          )}
        </View>
      </View>
    )
  }
)

const TokenData: FC<Props> = ({ token }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [bindOpenAnim, openAnimStyle] = useHover({ preset: 'opacityInverted' })

  const rows: Row[] = useMemo(() => {
    const usdMarketData = token.marketDataIn[0]

    return [
      {
        id: 'chain',
        label: t('Chain'),
        value: token.chainId
      },
      {
        id: 'address',
        label: t('Contract address'),
        value: token.address
      },
      typeof usdMarketData?.marketCap === 'number' && {
        label: t('Market cap'),
        value: `${formatDecimals(usdMarketData.marketCap, 'value')}`
      },
      typeof usdMarketData?.totalSupply === 'number' && {
        label: t('Total supply'),
        value: `${formatDecimals(usdMarketData.totalSupply, 'value')}`
      },
      typeof usdMarketData?.fullyDilutedValuation === 'number' && {
        label: t('Fully diluted valuation'),
        value: `${formatDecimals(usdMarketData.fullyDilutedValuation, 'value')}`
      },
      typeof usdMarketData?.volume24h === 'number' && {
        label: t('Volume (24h)'),
        value: `${formatDecimals(usdMarketData.volume24h, 'value')}`
      }
    ].filter(Boolean) as Row[]
  }, [token, t])

  return (
    <>
      <TokenDetailsTitle title={t('About')} />
      <View
        style={[
          spacings.phSm,
          spacings.pv,
          !!token.meta?.website && spacings.mbTy,
          {
            backgroundColor: theme.secondaryBackground,
            borderRadius: BORDER_RADIUS_PRIMARY
          }
        ]}
      >
        {rows.map((row, index) => (
          <Row
            key={row.id || row.label}
            {...row}
            isLast={index === rows.length - 1}
            chainId={token.chainId}
          />
        ))}
      </View>
      {!!token.meta?.website && (
        <View
          style={{
            ...flexbox.directionRow,
            ...flexbox.alignCenter,
            ...spacings.phSm,
            ...spacings.mbTy,
            backgroundColor: theme.secondaryBackground,
            height: 56,
            borderRadius: BORDER_RADIUS_PRIMARY
          }}
        >
          <Text fontSize={14} weight="medium" appearance="secondaryText">
            {t('Website')}
          </Text>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.flex1,
              flexbox.justifyEnd,
              spacings.mlXl
            ]}
          >
            <Label label={token.meta.website} />
            <AnimatedPressable
              {...bindOpenAnim}
              style={[openAnimStyle, spacings.mlTy]}
              onPress={() => openInTab({ url: token.meta?.website! })}
            >
              <OpenIcon />
            </AnimatedPressable>
          </View>
        </View>
      )}
    </>
  )
}

export default memo(TokenData)
