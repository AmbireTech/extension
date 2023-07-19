import { Token } from 'ambire-common/src/hooks/usePortfolio'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { Trans } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

interface Props extends Token {
  onPress?: () => void
}

const FoundTokenItem: React.FC<Props> = ({
  tokenImageUrl,
  address,
  network,
  name,
  symbol,
  balance,
  onPress
}) => {
  const { t } = useTranslation()

  return (
    <View style={[flexboxStyles.directionRow, spacings.mbLg]}>
      <TokenIcon withContainer uri={tokenImageUrl} address={address} networkId={network} />

      <View style={[spacings.mlTy, flexboxStyles.flex1]}>
        <Text>
          {name}
          {symbol ? ` (${symbol})` : ''}
        </Text>

        <Trans>
          <Text numberOfLines={1}>
            Balance: <Text style={textStyles.highlightPrimary}>{balance.toString()}</Text>{' '}
            <Text weight="medium">{symbol}</Text>
          </Text>
        </Trans>
      </View>
      {!!onPress && (
        <Button size="small" onPress={onPress} text={t('Restore')} style={spacings.mlSm} />
      )}
    </View>
  )
}

export default React.memo(FoundTokenItem)
