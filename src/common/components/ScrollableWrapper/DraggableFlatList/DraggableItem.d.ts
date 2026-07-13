import React from 'react'

export type DraggableItemProps = {
  id: string
  children: (isDragging: boolean, listeners: any, attributes: any) => React.ReactNode
}

declare const DraggableItem: React.NamedExoticComponent<DraggableItemProps>

export default DraggableItem
