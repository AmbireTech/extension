/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { isWeb } from '@common/config/env'
import useElementSize from '@common/hooks/useElementSize'
import useWindowSize from '@common/hooks/useWindowSize'
import { SPACING } from '@common/styles/spacings'

const useSelect = (props?: { maxMenuHeight: number }) => {
  const { maxMenuHeight = 400 } = props || {}
  const selectRef: React.MutableRefObject<any> = useRef(null)
  const menuRef: React.MutableRefObject<any> = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { control, watch, setValue: setSearch } = useForm({ defaultValues: { search: '' } })
  const { x, y, height, width, forceUpdate } = useElementSize(selectRef)
  const { height: windowHeight } = useWindowSize()

  const search = watch('search')

  // close menu on click outside
  useEffect(() => {
    if (!isWeb) return
    function handleClickOutside(event: MouseEvent) {
      if (!isMenuOpen) return

      if (
        menuRef.current &&
        selectRef.current &&
        !menuRef.current?.contains(event.target) &&
        !selectRef.current?.contains(event.target)
      ) {
        setIsMenuOpen(false)
        setSearch('search', '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      if (!isWeb) return
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen, setSearch])

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev)

    forceUpdate() // calculate menu position
  }, [forceUpdate])

  const menuPosition: 'top' | 'bottom' = useMemo(() => {
    if (!!isMenuOpen && y + height + maxMenuHeight > windowHeight && y - maxMenuHeight > 0)
      return 'top'

    return 'bottom'
  }, [height, isMenuOpen, maxMenuHeight, windowHeight, y])

  const maxMenuDynamicHeight = useMemo(() => {
    if (menuPosition === 'bottom' && y + height + maxMenuHeight > windowHeight) {
      return windowHeight - (y + height) - SPACING
    }

    return maxMenuHeight
  }, [height, maxMenuHeight, menuPosition, windowHeight, y])

  return {
    selectRef,
    menuRef,
    isMenuOpen,
    setIsMenuOpen,
    control,
    search,
    setSearch,
    forceUpdate,
    toggleMenu,
    menuProps: {
      x,
      y,
      height,
      width,
      position: menuPosition,
      maxDynamicHeight: maxMenuDynamicHeight,
      windowHeight
    }
  }
}

export default useSelect
