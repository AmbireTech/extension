import { useCallback, useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

type Props = {
  isMultisigSigned: boolean
  onReject: () => void
}

const useRejectConfirmation = ({ isMultisigSigned, onReject }: Props) => {
  const { ref: sheetRef, open: openModal, close: closeModal } = useModalize()

  const handleReject = useCallback(() => {
    if (isMultisigSigned) {
      openModal()
      return
    }

    onReject()
  }, [isMultisigSigned, onReject, openModal])

  const handleConfirmedReject = useCallback(() => {
    closeModal()
    onReject()
  }, [closeModal, onReject])

  return useMemo(
    () => ({ sheetRef, closeModal, handleReject, handleConfirmedReject }),
    [sheetRef, closeModal, handleReject, handleConfirmedReject]
  )
}

export default useRejectConfirmation
