import React from 'react'
import Badge from '@common/components/Badge'

const Wrapper = ({ text, children }: { text: string; children: React.ReactNode }) => {
  return (
    <Badge text={text} type="secondaryAccent" isIconLeading>
      {children}
    </Badge>
  )
}

export default React.memo(Wrapper)
