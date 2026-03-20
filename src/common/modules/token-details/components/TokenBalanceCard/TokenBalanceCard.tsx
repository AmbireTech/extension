import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useTheme from '@common/hooks/useTheme'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import TokenDetailsTitle from '@common/modules/token-details/components/Title'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type TokenBalanceCardProps = Pick<
  ReturnType<typeof getAndFormatTokenDetails>,
  'balanceFormatted' | 'balanceUSDFormatted' | 'change24h' | 'change24hFormatted'
> &
  Pick<TokenResult, 'symbol' | 'address' | 'chainId'> & {
    onGasTank?: boolean
    isRewards?: boolean
    isVesting?: boolean
    containerStyle?: ViewStyle
  }

const TokenBalanceCard = ({
  symbol,
  address,
  chainId,
  onGasTank,
  balanceFormatted,
  balanceUSDFormatted,
  change24h,
  change24hFormatted,
  isRewards,
  isVesting,
  containerStyle
}: TokenBalanceCardProps) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return (
    <View>
      <TokenDetailsTitle title={t('Your balance')} />
      <View style={[styles.tokenInfoAndIcon, containerStyle]}>
        <TokenIcon
          containerHeight={40}
          containerWidth={40}
          width={32}
          height={32}
          networkSize={16}
          withContainer
          address={address}
          onGasTank={onGasTank}
          chainId={chainId}
        />
        <View style={styles.tokenInfo}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text
              fontSize={15}
              selectable
              weight="semiBold"
              style={{ ...spacings.mrSm, lineHeight: 20 }}
            >
              {symbol}
            </Text>
            {isRewards && (
              <Text fontSize={12} weight="medium">
                {t('Claimable rewards')}
              </Text>
            )}
            {isVesting && (
              <Text fontSize={12} weight="medium">
                {t('Claimable early supporters vesting')}
              </Text>
            )}
          </View>
          <Text fontSize={13} appearance="secondaryText" weight="medium">
            {balanceFormatted}
          </Text>
          {!!onGasTank && (
            <View style={styles.balance}>
              <Text
                style={spacings.mtMi}
                color={theme.errorDecorative}
                fontSize={12}
                weight="number_regular"
                numberOfLines={1}
              >
                (This token is a gas tank one and therefore actions are limited)
              </Text>
            </View>
          )}
        </View>
        <View style={flexbox.alignEnd}>
          <Text fontSize={15} weight="number_bold" style={{ lineHeight: 20 }}>
            {balanceUSDFormatted}
          </Text>
          {typeof change24h === 'number' && (
            <Text
              fontSize={13}
              weight="number_medium"
              appearance={change24h >= 0 ? 'successText' : 'errorText'}
              style={spacings.mlMi}
            >
              {change24hFormatted}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export default React.memo(TokenBalanceCard)
