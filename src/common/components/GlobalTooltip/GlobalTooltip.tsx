import { useEffect, useRef, useState } from 'react'
import { ITooltip } from 'react-tooltip'

import Tooltip from '@common/components/Tooltip'

interface TooltipProps {
  id: string | null
  props: any | null
}

export function GlobalTooltip() {
  const [current, setCurrent] = useState<TooltipProps>({ id: null, props: null })

  const pointerPos = useRef({ x: 0, y: 0 })
  const lastEl = useRef<Element | null>(null)

  useEffect(() => {
    const extractTooltip = (el: Element | null) => {
      if (!el) return null
      const target = el.closest('[data-tooltip]')
      if (!(target as any)?.dataset?.tooltip) return
      try {
        return JSON.parse((target as any).dataset.tooltip)
      } catch {
        return null
      }
    }

    const applyTooltip = (data: any | null) => {
      setCurrent(data ? { id: data.id, props: data } : { id: null, props: null })
    }

    const handlePointerMove = (e: PointerEvent) => {
      pointerPos.current.x = e.clientX
      pointerPos.current.y = e.clientY

      const el = (e.target as HTMLElement)?.closest('[data-tooltip]')
      lastEl.current = el || null

      applyTooltip(extractTooltip(el))
    }

    const handleScroll = () => {
      if (!pointerPos.current.x && !pointerPos.current.y) return

      const el = document.elementFromPoint(
        pointerPos.current.x,
        pointerPos.current.y
      ) as HTMLElement | null
      const newEl = el?.closest('[data-tooltip]') || null

      if (newEl !== lastEl.current) {
        lastEl.current = newEl
        applyTooltip(extractTooltip(newEl))
      }
    }

    document.addEventListener('pointermove', handlePointerMove, true)
    document.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('pointermove', handlePointerMove, true)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  return (
    <Tooltip
      id="global-tooltip"
      anchorSelect={current.id ? `[data-tooltip*='"id":"${current.id}"']` : null}
      {...(current.props || {})}
    />
  )
}

export function createGlobalTooltipDataSet(
  props: Omit<ITooltip, 'render' | 'html' | 'children' | 'wrapper'>
) {
  return { tooltip: JSON.stringify(props) }
}
