import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import { Account as AccountType } from '@ambire-common/interfaces/account'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = Pick<AccountType, 'addr' | 'creation' | 'preferences'> & {
  style?: ViewStyle
}

const Account: FC<Props> = ({ addr, creation, preferences, style }) => {
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
        flexbox.flex1,
        {
          width: '100%',
          backgroundColor: theme.secondaryBackground
        },
        style
      ]}
    >
      <Avatar isSmart={!!creation} size={32} pfp={pfp} address={addr} />
      <View>
        <Text fontSize={14} weight="medium">
          {label}
        </Text>
        <Text fontSize={12} appearance="secondaryText">
          {addr}
        </Text>
      </View>
    </View>
  )
}

export default Account
