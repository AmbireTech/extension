import React, { FC } from 'react'
import { ColorValue, View } from 'react-native'

import EnsIcon from '@common/assets/svg/EnsIcon'
import NamoshiIcon from '@common/assets/svg/NamoshiIcon'
import { ReverseLookupResult } from '@common/hooks/useReverseLookup/useReverseLookup'
import spacings from '@common/styles/spacings'

const DomainBadge: FC<
  Pick<ReverseLookupResult, 'name' | 'type'> & {
    color?: ColorValue
  }
> = ({ name, type, color }) => {
  if (!name && !type) return null

  return (
    <View style={{ zIndex: 2, borderRadius: 50, ...spacings.mrMi }}>
      {type === 'ens' && <EnsIcon width={16} height={16} color={color} />}
      {type === 'namoshi' && <NamoshiIcon width={16} height={16} isActive color={color} />}
    </View>
  )
}

export default React.memo(DomainBadge)
