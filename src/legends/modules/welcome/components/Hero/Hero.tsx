import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { faDiscord } from '@fortawesome/free-brands-svg-icons/faDiscord'
import { faTelegram } from '@fortawesome/free-brands-svg-icons/faTelegram'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import glowingButton from '@legends/common/assets/images/glowing-button.png'
import RhombusDeco from '@legends/common/assets/svg/RhombusDeco'
import useAccountContext from '@legends/hooks/useAccountContext'
import { LEGENDS_ROUTES } from '@legends/modules/router/constants'

import backgroundSm from './assets/background-sm.png'
import backgroundXlImage from './assets/background-xl.jpg'
import backgroundXl2xImage from './assets/background-xl@x2.jpg'
import inviteImage from './assets/invite.png'
import styles from './Hero.module.scss'

const Hero = () => {
  const navigate = useNavigate()
  const { connectedAccount, requestAccounts } = useAccountContext()

  useEffect(() => {
    if (connectedAccount) {
      navigate(LEGENDS_ROUTES.character)
    }
  }, [connectedAccount, navigate])

  const isExtensionInstalled = !!window.ambire

  return (
    <div className={styles.wrapper}>
      <picture className={styles.background}>
        <source srcSet={backgroundXlImage} media="(min-width: 600px)" />
        <source srcSet={`${backgroundXl2xImage} 2x`} media="(min-width: 600px)" />
        <img src={backgroundSm} alt="background" />
      </picture>
      <div className={styles.container}>
        <div className={styles.content}>
          <img src="/images/logo.png" alt="Ambire Legends" className={styles.logo} />
          <h1 className={styles.title}>
            Experience the Power of Smart Accounts With an Epic Onchain Adventure
          </h1>
          <div className={styles.actions}>
            <div className={styles.buttonAndDisclaimer}>
              <button
                type="button"
                className={styles.button}
                style={{
                  backgroundImage: `url(${glowingButton})`
                }}
                onClick={() => {
                  if (isExtensionInstalled) {
                    requestAccounts()
                  } else {
                    window.open(
                      'https://chromewebstore.google.com/detail/ambire-wallet/ehgjhhccekdedpbkifaojjaefeohnoea',
                      '_blank'
                    )
                  }
                }}
              >
                <div className={styles.buttonInner}>
                  <RhombusDeco className={styles.leftDeco} />
                  {!isExtensionInstalled ? 'Get the Extension' : 'Connect'}
                  <RhombusDeco className={styles.rightDeco} />
                </div>
              </button>
              {!isExtensionInstalled && (
                <p className={styles.disclaimer}>
                  If you have installed the extension, please refresh the page
                </p>
              )}
            </div>

            <div className={styles.invitation}>
              <img src={inviteImage} alt="Invite" className={styles.invitationImage} />
              <div className={styles.invitationMenu}>
                <a
                  href="https://www.ambire.com/discord"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.menuSocial}
                >
                  <FontAwesomeIcon className={styles.socialIcon} icon={faDiscord} />
                  <span className={styles.socialName}>Discord</span>
                </a>
                <a
                  href="https://t.me/AmbireOfficial"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.menuSocial}
                >
                  <FontAwesomeIcon className={styles.socialIcon} icon={faTelegram} />
                  <span className={styles.socialName}>Telegram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
