import React, { FC } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import styles from './Link.module.scss'

type Props = {
  to: string
  text: string
  icon: any
  isActive: boolean
  newTab?: boolean
  isExternal?: boolean
}

const isExternalHref = (url: string) => url.startsWith('https://')

const Link: FC<Props> = ({ to, text, icon, isActive, newTab, isExternal }) => {
  const className = `${styles.wrapper} ${isActive ? styles.active : ''} ${!to ? styles.disabled : ''}`
  const contents = (
    <>
      <div className={styles.iconWrapper}>
        <FontAwesomeIcon size="lg" icon={icon} />
      </div>
      <span>{text}</span>
    </>
  )

  if (isExternal !== undefined ? isExternal : isExternalHref(to)) {
    return (
      <a
        href={to}
        className={className}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
      >
        {contents}
      </a>
    )
  }

  return (
    <RouterLink to={to} className={className} target={newTab ? '_blank' : undefined}>
      {contents}
    </RouterLink>
  )
}

export default Link
