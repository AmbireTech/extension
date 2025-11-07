import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import PlainAddress from '@common/components/AccountAddress/PlainAddress'
import PlainAddressWithCopy from '@common/components/AccountAddress/PlainAddressWithCopy'
import Text from '@common/components/Text'
import useReverseLookup from '@common/hooks/useReverseLookup'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props extends ReturnType<typeof useReverseLookup> {
  address: string
  plainAddressMaxLength?: number
  withCopy?: boolean
}

const AccountAddress: FC<Props> = ({
  isLoading,
  ens,
  address,
  plainAddressMaxLength = 42,
  withCopy = true
}) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Text fontSize={12} appearance="secondaryText">
        {t('Resolving domain...')}
      </Text>
    )
  }

  return (
    <View style={[flexbox.flex1, { height: 18 }]} testID="address">
      {ens ? (
        <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
          <Text fontSize={12} weight="semiBold" appearance="primary" numberOfLines={1}>
            {ens}
          </Text>
          {withCopy ? (
            <PlainAddressWithCopy maxLength={18} address={address} style={spacings.mlMi} />
          ) : (
            <PlainAddress maxLength={18} address={address} style={spacings.mlMi} />
          )}
        </View>
      ) : withCopy ? (
        <PlainAddressWithCopy maxLength={plainAddressMaxLength} address={address} hideParentheses />
      ) : (
        <PlainAddress maxLength={plainAddressMaxLength} address={address} hideParentheses />
      )}
    </View>
  )
}

export default React.memo(AccountAddress)
