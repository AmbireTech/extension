import { useEffect, useRef, useState } from 'react'
import { TooltipRefProps } from 'react-tooltip'

import Tooltip from '@common/components/Tooltip'

import { GLOBAL_TOOLTIP_REFRESH_EVENT } from './'

interface TooltipProps {
  id: string | null
  props: any | null
}

export function GlobalTooltip() {
  const [current, setCurrent] = useState<TooltipProps>({ id: null, props: null })
  const tooltipRef = useRef<TooltipRefProps | null>(null)
  const pointerPos = useRef({ x: 0, y: 0 })
  const lastEl = useRef<Element | null>(null)
  const scrollTimeout = useRef<ReturnType<typeof setInterval> | null>(null)

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

    const refreshTooltip = () => {
      let target = lastEl.current

      if (!target && (pointerPos.current.x || pointerPos.current.y)) {
        target = document.elementFromPoint(pointerPos.current.x, pointerPos.current.y)
      }

      applyTooltip(extractTooltip(target))
    }

    const handlePointerMove = (e: PointerEvent) => {
      pointerPos.current.x = e.clientX
      pointerPos.current.y = e.clientY

      const el = (e.target as HTMLElement)?.closest('[data-tooltip]')
      lastEl.current = el || null

      applyTooltip(extractTooltip(el))
    }

    const handleScroll = () => {
      !!scrollTimeout.current && clearTimeout(scrollTimeout.current)

      scrollTimeout.current = setTimeout(() => {
        // Detect tooltip only after scroll stops
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
      }, 80)
    }

    const handleRefreshTooltip = () => {
      refreshTooltip()
    }

    document.addEventListener('pointermove', handlePointerMove, true)
    document.addEventListener('scroll', handleScroll, true)
    window.addEventListener(GLOBAL_TOOLTIP_REFRESH_EVENT, handleRefreshTooltip as EventListener)

    return () => {
      document.removeEventListener('pointermove', handlePointerMove, true)
      document.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener(
        GLOBAL_TOOLTIP_REFRESH_EVENT,
        handleRefreshTooltip as EventListener
      )
    }
  }, [])

  useEffect(() => {
    if (current.id && tooltipRef.current) {
      tooltipRef.current?.open()
    }
  }, [current.id])

  return (
    <Tooltip
      tooltipRef={tooltipRef}
      id="global-tooltip"
      anchorSelect={current.id ? `[data-tooltip*='"id":"${current.id}"']` : null}
      {...(current.props || {})}
    />
  )
}
