import { FC } from 'react'

import { WithGlassViewSupportProps } from './types'

const WithGlassViewSupport: FC<WithGlassViewSupportProps> = ({ children }) => {
  // Nothing special is needed for mobile
  return children
}

export default WithGlassViewSupport
