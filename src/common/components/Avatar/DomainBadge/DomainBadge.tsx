import React, { FC } from 'react'
import { View } from 'react-native'

import EnsCircularIcon from '@common/assets/svg/EnsCircularIcon'
import spacings from '@common/styles/spacings'

interface Props {
  ens?: string | null
}

const DomainBadge: FC<Props> = ({ ens }) => {
  if (!ens) return null

  return (
    <View style={{ zIndex: 2, borderRadius: 50, ...spacings.mrMi }}>
      {ens && <EnsCircularIcon />}
    </View>
  )
}

export default React.memo(DomainBadge)
