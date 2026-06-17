import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import { Account as AccountType } from '@ambire-common/interfaces/account'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
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
      <View style={{ flexShrink: 1 }}>
        <Text weight="semiBold">{label}</Text>
        <Text
          fontSize={12}
          appearance="secondaryText"
          weight="mono_regular"
          style={{ flexShrink: 1 }}
        >
          {addr}
        </Text>
      </View>
    </View>
  )
}

export default Account
