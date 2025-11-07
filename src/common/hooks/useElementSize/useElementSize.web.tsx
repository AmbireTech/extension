import { MutableRefObject, useCallback, useLayoutEffect, useState } from 'react'

const useElementSize = (ref: MutableRefObject<HTMLElement | null>) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const updateElementSize = useCallback(() => {
    if (ref.current) {
      const { width, height, x, y } = ref.current.getBoundingClientRect()
      setDimensions({ width, height })
      setPosition({ x, y })
    }
  }, [ref])

  useLayoutEffect(() => {
    updateElementSize()

    let resizeObserver: any = new ResizeObserver(updateElementSize)
    const currentElement = ref.current
    if (currentElement) {
      resizeObserver.observe(currentElement)
      window.addEventListener('resize', updateElementSize)
    }

    return () => {
      if (!currentElement) return

      resizeObserver.unobserve(currentElement)
      resizeObserver = null
      window.removeEventListener('resize', updateElementSize)
    }
  }, [ref, updateElementSize])

  const maxElementWidthSize = (size: number) => {
    return size <= dimensions.width
  }

  const minElementWidthSize = (size: number) => {
    return size > dimensions.width
  }

  return {
    ...dimensions,
    ...position,
    maxElementWidthSize,
    minElementWidthSize,
    forceUpdate: updateElementSize
  }
}

export default useElementSize
