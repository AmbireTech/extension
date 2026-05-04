import React from 'react'
import { View } from 'react-native'

import { AnimateLayoutChanges, defaultAnimateLayoutChanges, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Props = {
  id: string
  children: (isDragging: boolean, listeners: any, attributes: any) => React.ReactNode
}

const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true })

const DraggableItem = ({ id, children }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    animateLayoutChanges
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    // @ts-ignore
    <View ref={setNodeRef} style={style}>
      {children(isDragging, listeners, attributes)}
    </View>
  )
}

export default React.memo(DraggableItem)
