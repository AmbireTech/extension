import React from 'react'

type TooltipData = {
  id: string
  children: React.ReactNode
}

type Listener = (id: string | null) => void

class TooltipManager {
  private tooltips: Record<string, TooltipData> = {}
  private listeners: Listener[] = []
  private activeTooltipId: string | null = null

  register(id: string, children: React.ReactNode) {
    this.tooltips[id] = { id, children }
  }

  unregister(id: string) {
    delete this.tooltips[id]
  }

  show(id: string, children?: React.ReactNode) {
    if (children) {
      this.tooltips[id] = { id, children }
    }
    if (this.tooltips[id]) {
      this.activeTooltipId = id
      this.notify()
    }
  }

  hide() {
    this.activeTooltipId = null
    this.notify()
  }

  getActiveTooltip() {
    return this.activeTooltipId ? this.tooltips[this.activeTooltipId] : null
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach((l) => l(this.activeTooltipId))
  }
}

export const tooltipManager = new TooltipManager()
