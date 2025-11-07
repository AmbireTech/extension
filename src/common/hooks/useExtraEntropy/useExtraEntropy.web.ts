import { useCallback, useEffect, useState } from 'react'

import { generateUuid } from '@ambire-common/utils/uuid'

const useExtraEntropy = () => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number; timestamp: number } | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY, timestamp: e.timeStamp })
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const getExtraEntropy = useCallback(() => {
    const mouseEntropy = mousePos ? `${mousePos.x}-${mousePos.y}-${mousePos.timestamp}` : null
    const uuid = generateUuid()
    const extraEntropy = `${mouseEntropy || uuid}-${performance.now()}`

    return extraEntropy
  }, [mousePos])

  return {
    getExtraEntropy
  }
}

export default useExtraEntropy
