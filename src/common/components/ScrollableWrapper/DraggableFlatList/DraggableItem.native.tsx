import React from 'react'
import { View } from 'react-native'

type Props = {
  id: string
  children: (isDragging: boolean, listeners: any, attributes: any) => React.ReactNode
}

const DraggableItem = ({ id, children }: Props) => {
  return (
    <View>
      {children(false, undefined, undefined)}
    </View>
  )
}

export default React.memo(DraggableItem)
