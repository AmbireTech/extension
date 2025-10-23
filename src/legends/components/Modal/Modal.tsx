import React, { FC, useEffect } from 'react'
import { createPortal } from 'react-dom'

import CloseIcon from '@legends/components/CloseIcon'
import useEscModal from '@legends/hooks/useEscModal'

import styles from './Modal.module.scss'

type ComponentProps = {
  children: React.ReactNode
  className?: string
}

type ModalProps = ComponentProps & {
  isOpen: boolean
  handleClose?: () => void
  isClosable?: boolean
  showCloseButton?: boolean
  wrapperClassName?: string
}

const Heading: FC<ComponentProps> = ({ children, className }) => {
  return <h2 className={`${styles.heading} ${className}`}>{children}</h2>
}
const Text: FC<ComponentProps> = ({ children, className }) => {
  return <p className={`${styles.text} ${className}`}>{children}</p>
}

const Modal = ({
  children,
  className,
  isOpen,
  handleClose,
  isClosable = true,
  showCloseButton = true,
  wrapperClassName
}: ModalProps) => {
  const modalRef = React.useRef<HTMLDivElement>(null)

  const closeModal = () => {
    if (isClosable && handleClose) handleClose()
  }

  // Close Modal on ESC
  useEscModal(isOpen, closeModal)

  // Close the modal when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) {
        closeModal()
      }
    }

    document.addEventListener('mousedown', handleClickOutside, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  })

  const modalContent = (
    <div className={`${styles.wrapper} ${isOpen ? styles.open : ''} ${wrapperClassName || ''}`}>
      <div ref={modalRef} className={`${styles.modal} ${className}`}>
        {isClosable && showCloseButton && (
          <button onClick={closeModal} type="button" className={styles.closeButton}>
            <CloseIcon />
          </button>
        )}
        {isOpen && children}
      </div>
    </div>
  )

  return createPortal(modalContent, document.getElementById('modal-root') as HTMLElement)
}

Modal.Heading = Heading
Modal.Text = Text

export default Modal
