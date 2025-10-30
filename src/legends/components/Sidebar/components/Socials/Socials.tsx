import React from 'react'

import { faDiscord } from '@fortawesome/free-brands-svg-icons/faDiscord'
import { faTelegram } from '@fortawesome/free-brands-svg-icons/faTelegram'
import { faXTwitter } from '@fortawesome/free-brands-svg-icons/faXTwitter'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import HighlightedLink from '../HighlightedLink'
import styles from './Socials.module.scss'

const SOCIALS = [
  {
    name: 'telegram',
    icon: faTelegram,
    link: 'https://t.me/AmbireOfficial'
  },
  {
    name: 'twitter',
    icon: faXTwitter,
    link: 'https://x.com/ambire'
  },
  {
    name: 'discord',
    icon: faDiscord,
    link: 'https://www.ambire.com/discord'
  }
]

const Socials = () => {
  return (
    <div className={styles.wrapper}>
      <a
        target="_blank"
        href="https://www.ambire.com/discord"
        className={styles.discordLink}
        rel="noreferrer"
      >
        <FontAwesomeIcon icon={faDiscord} />
        Join Discord
      </a>
      <div className={styles.socials}>
        {SOCIALS.map((social) => (
          <a
            key={social.link}
            href={social.link}
            target="_blank"
            rel="noreferrer"
            className={`${styles.social} ${styles[`${social.name}Social`]}`}
          >
            <FontAwesomeIcon icon={social.icon} />
          </a>
        ))}
      </div>
    </div>
  )
}

export default Socials
