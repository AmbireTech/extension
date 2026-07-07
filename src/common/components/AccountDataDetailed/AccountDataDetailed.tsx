import React, { useMemo } from 'react'
import { View } from 'react-native'

import AccountAddress from '@common/components/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useReverseLookup from '@common/hooks/useReverseLookup'
import flexbox from '@common/styles/utils/flexbox'

const AccountDataDetailed = () => {
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const reverseLookup = useReverseLookup({
    address: account?.addr || ''
  })

  const smartAccountType = useMemo(() => {
    if (account?.creation) return 'Ambire'
    if (account?.safeCreation) return 'Safe'
    return undefined
  }, [account])

  if (!account) return null

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
      <Avatar
        address={account.addr}
        pfp={account.preferences.pfp}
        smartAccountType={smartAccountType}
      />
      <View style={flexbox.flex1}>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text fontSize={16} weight="semiBold" numberOfLines={1}>
            {account.preferences.label}
          </Text>
          <AccountBadges accountData={account} />
        </View>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <AccountAddress {...reverseLookup} address={account.addr} />
        </View>
      </View>
    </View>
  )
}

export default AccountDataDetailed
