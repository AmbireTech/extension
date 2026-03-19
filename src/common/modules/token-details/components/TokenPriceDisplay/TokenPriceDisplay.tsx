import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type TokenPriceDisplayProps = Pick<TokenResult, 'symbol' | 'address' | 'chainId'> &
  Pick<
    ReturnType<typeof getAndFormatTokenDetails>,
    'priceUSDFormatted' | 'change24h' | 'change24hFormatted'
  > & {
    onGasTank?: boolean
  }

const TokenPriceDisplay = ({
  symbol,
  address,
  chainId,
  onGasTank,
  priceUSDFormatted,
  change24h,
  change24hFormatted
}: TokenPriceDisplayProps) => {
  const { t } = useTranslation()

  return (
    <View style={spacings.phTy}>
      {/* Symbol Badge */}
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <TokenIcon
          containerHeight={16}
          containerWidth={16}
          width={12}
          height={12}
          withContainer
          withNetworkIcon={false}
          address={address}
          onGasTank={onGasTank}
          chainId={chainId as any}
        />
        <Text fontSize={14} appearance="secondaryText" weight="number_medium" style={spacings.mlMi}>
          {symbol}
        </Text>
      </View>

      {/* Price Info */}
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
        <Text fontSize={32} weight="medium" style={{ ...spacings.mrTy, lineHeight: 48 }}>
          {priceUSDFormatted}
        </Text>
        {typeof change24h === 'number' && (
          <Text
            fontSize={14}
            weight="number_medium"
            appearance={change24h >= 0 ? 'successText' : 'errorText'}
          >
            {change24hFormatted} ({t('24h')})
          </Text>
        )}
      </View>
    </View>
  )
}

export default React.memo(TokenPriceDisplay)
