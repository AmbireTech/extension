import React, { FC, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from './Modal.module.scss'

type ComponentProps = {
  children: React.ReactNode
  className?: string
}

type ModalProps = ComponentProps & {
  isOpen: boolean
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
  isClosable?: boolean
  showCloseButton?: boolean
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
  setIsOpen,
  isClosable = true,
  showCloseButton = true
}: ModalProps) => {
  const modalRef = React.useRef<HTMLDivElement>(null)

  const closeModal = () => {
    if (isClosable && setIsOpen) setIsOpen(false)
  }

  // Close the modal when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  })

  const modalContent = (
    <div className={`${styles.wrapper} ${isOpen ? styles.open : ''}`}>
      <div ref={modalRef} className={`${styles.modal} ${className}`}>
        {isClosable && showCloseButton && (
          <button onClick={closeModal} type="button" className={styles.closeButton}>
            <FontAwesomeIcon icon={faTimes} />
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
