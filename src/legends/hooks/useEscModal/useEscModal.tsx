import { useEffect } from 'react'

function useEscModal(isOpen: boolean, closeModal: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, { passive: true })
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closeModal])
}

export default useEscModal
