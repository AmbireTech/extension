import React from 'react'
import { View } from 'react-native'

import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export interface Account {
  type: string
  address: string
  brandName: string
  alianName?: string
  displayBrandName?: string
  index?: number
  balance?: number
}

const AccountsList = ({ accounts, loading }: { accounts: Account[]; loading?: boolean }) => {
  if (loading) {
    return <Spinner />
  }

  return (
    <View>
      {accounts.map((acc, idx) => {
        if (acc.address) {
          return (
            <View key={acc.address} style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text weight="semiBold" style={spacings.mhSm}>
                {acc?.index || idx + 1}
              </Text>
              <View
                style={{
                  padding: 10,
                  marginBottom: 10,
                  backgroundColor: colors.chetwode_50,
                  borderRadius: 10
                }}
              >
                <Text fontSize={12} weight="medium">
                  Legacy Account
                </Text>
                <Text>{acc.address}</Text>
              </View>
            </View>
          )
        }
        return null
      })}
    </View>
  )
}

export default React.memo(AccountsList)
