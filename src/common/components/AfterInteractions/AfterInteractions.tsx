import { ReactNode, useEffect, useState } from 'react'

import runWhenIdle from '@common/utils/runWhenIdle'

interface Props {
  children: any
  placeholder?: ReactNode
  enabled?: boolean
}

const AfterInteractions = ({ children, placeholder, enabled = true }: Props) => {
  const [interactionsComplete, setInteractionsComplete] = useState(false)

  useEffect(() => runWhenIdle(() => setInteractionsComplete(true)), [])

  if (!enabled) {
    return children
  }

  if (interactionsComplete) {
    return children
  }

  if (placeholder) {
    return placeholder
  }

  return null
}

export default AfterInteractions
