import React, { FC } from 'react'
import { View } from 'react-native'

import EnsCircularIcon from '@common/assets/svg/EnsCircularIcon'
import NamoshiIcon from '@common/assets/svg/NamoshiIcon'
import { ReverseLookupResult } from '@common/hooks/useReverseLookup/useReverseLookup'
import spacings from '@common/styles/spacings'

const DomainBadge: FC<Pick<ReverseLookupResult, 'name' | 'type'>> = ({ name, type }) => {
  if (!name && !type) return null

  return (
    <View style={{ zIndex: 2, borderRadius: 50, ...spacings.mrMi }}>
      {type === 'ens' && <EnsCircularIcon />}
      {type === 'namoshi' && <NamoshiIcon width={16} height={16} isActive />}
    </View>
  )
}

export default React.memo(DomainBadge)
