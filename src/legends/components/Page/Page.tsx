import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'

import { faBars } from '@fortawesome/free-solid-svg-icons/faBars'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import AccountInfo from '@legends/components/AccountInfo'
import Sidebar from '@legends/components/Sidebar'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'

import styles from './Page.module.scss'

const Page = ({
  children,
  pageRef,
  style,
  containerSize = 'md'
}: {
  children: React.ReactNode | React.ReactNode[]
  pageRef?: React.RefObject<HTMLDivElement>
  style?: React.CSSProperties
  containerSize?: 'md' | 'lg' | 'full'
}) => {
  const customContainerSizeClass = styles[`container${containerSize}`] || ''
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { pathname } = useLocation()

  const { connectedAccount } = useAccountContext()
  const { isCharacterNotMinted } = useCharacterContext()

  const openSidebar = () => setIsSidebarOpen(true)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div>
      <div className={styles.wrapper}>
        <Sidebar handleClose={closeSidebar} isOpen={isSidebarOpen} />

        <div ref={pageRef} className={`${styles.scroll} ${styles.containerfull}`} style={style}>
          <div className={`${styles.container} ${customContainerSizeClass}`}>
            <div className={styles.header}>
              <button className={styles.sidebarButton} type="button" onClick={openSidebar}>
                <FontAwesomeIcon icon={faBars} />
              </button>
              {connectedAccount && !isCharacterNotMinted && (
                <div className={styles.account}>
                  <AccountInfo removeAvatarAndLevel={isCharacterNotMinted} />
                </div>
              )}
            </div>
            <div className={styles.content}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
