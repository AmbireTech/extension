import React, { FC } from 'react'
import { View } from 'react-native'

import EnsCircularIcon from '@common/assets/svg/EnsCircularIcon'
import NamoshiIcon from '@common/assets/svg/NamoshiIcon'
import spacings from '@common/styles/spacings'

interface Props {
  ens?: string | null
  namoshi?: string | null
}

const DomainBadge: FC<Props> = ({ ens, namoshi }) => {
  if (!ens && !namoshi) return null

  return (
    <View style={{ zIndex: 2, borderRadius: 50, ...spacings.mrMi }}>
      {ens && <EnsCircularIcon />}
      {namoshi && <NamoshiIcon width={16} height={16} isActive />}
    </View>
  )
}

export default React.memo(DomainBadge)
