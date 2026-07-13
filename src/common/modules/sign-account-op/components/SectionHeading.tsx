import React, { FC } from 'react'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'

interface Props {
  children: React.ReactNode
  withMb?: boolean
}

const SectionHeading: FC<Props> = ({ children, withMb = true }) => {
  return (
    <Text fontSize={20} weight="medium" style={withMb ? spacings.mb : spacings.mb0}>
      {children}
    </Text>
  )
}

export default SectionHeading
