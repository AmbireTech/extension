import React, { useMemo } from 'react'
import { View } from 'react-native'

import AccountAddress from '@common/components/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useReverseLookup from '@common/hooks/useReverseLookup'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

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
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.flex1,
        isSidePanel && { minWidth: 0 }
      ]}
    >
      <Avatar
        address={account.addr}
        pfp={account.preferences.pfp}
        smartAccountType={smartAccountType}
      />
      <View style={[flexbox.flex1, isSidePanel && spacings.mlSm, isSidePanel && { minWidth: 0 }]}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, isSidePanel && { minWidth: 0 }]}>
          <Text
            fontSize={16}
            weight="semiBold"
            numberOfLines={1}
            // A long label would otherwise push the badges out of the narrow panel
            style={isSidePanel ? { flexShrink: 1, minWidth: 0 } : undefined}
          >
            {account.preferences.label}
          </Text>
          <AccountBadges accountData={account} />
        </View>
        <View style={[flexbox.directionRow, flexbox.alignCenter, isSidePanel && { minWidth: 0 }]}>
          {isSidePanel ? (
            <AccountAddress
              {...reverseLookup}
              address={account.addr}
              plainAddressMaxLength={16}
              withCopy={false}
            />
          ) : (
            <AccountAddress {...reverseLookup} address={account.addr} withCopy={isWeb} />
          )}
        </View>
      </View>
    </View>
  )
}

export default AccountDataDetailed
