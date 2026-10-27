import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import { Account as AccountType } from '@ambire-common/interfaces/account'
import AccountAddress from '@common/components/AccountAddress'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = Pick<AccountType, 'addr' | 'creation' | 'preferences' | 'safeCreation'> & {
  style?: ViewStyle
}

const Account: FC<Props> = ({ addr, creation, preferences, style, safeCreation }) => {
  const { theme } = useTheme()
  const { label, pfp } = preferences || {}
  const reverseLookup = useReverseLookup({ address: addr, privacyUpdateMode: 'never' })

  return (
    <View
      style={[
        spacings.pvTy,
        spacings.phSm,
        flexbox.directionRow,
        flexbox.alignCenter,
        common.borderRadiusPrimary,
        isWeb && flexbox.flex1,
        {
          width: isWeb ? '100%' : 'auto',
          backgroundColor: theme.secondaryBackground
        },
        style
      ]}
    >
      <Avatar
        smartAccountType={(creation && 'Ambire') || (safeCreation && 'Safe')}
        size={40}
        pfp={pfp}
        address={addr}
      />
      {/* Like the account rows of the account select: one row each, the address shortened */}
      <View style={[flexbox.flex1, { minWidth: 0 }]}>
        <Text fontSize={15} weight="medium" numberOfLines={1}>
          {label}
        </Text>
        <AccountAddress {...reverseLookup} address={addr} fontSize={12} withCopy={false} />
      </View>
    </View>
  )
}

export default Account
