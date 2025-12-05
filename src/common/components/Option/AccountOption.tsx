import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import AccountAddress from '@common/components/AccountAddress'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import useReverseLookup from '@common/hooks/useReverseLookup'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import DomainBadge from '../Avatar/DomainBadge'

const AccountOption = ({ acc }: { acc: Account }) => {
  const { ens, isLoading } = useReverseLookup({ address: acc.addr })

  return (
    <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
      <Avatar
        pfp={acc.preferences.pfp}
        address={acc.addr}
        size={32}
        style={spacings.prTy}
        isSmart={isSmartAccount(acc)}
      />
      <View style={flexbox.flex1}>
        <Text fontSize={14} weight="medium" style={{ lineHeight: 20 }} numberOfLines={1}>
          {acc.preferences.label}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <DomainBadge ens={ens} />
          <AccountAddress
            isLoading={isLoading}
            ens={ens}
            address={acc.addr}
            plainAddressMaxLength={32}
            withCopy={false}
          />
        </View>
      </View>
    </View>
  )
}

export default AccountOption
