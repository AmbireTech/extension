import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import useAccountContext from '@legends/hooks/useAccountContext'

import styles from './WalletConnect.module.scss'

const WalletConnect = () => {
  const navigate = useNavigate()
  const { connectedAccount, requestAccounts } = useAccountContext()

  useEffect(() => {
    if (connectedAccount) {
      navigate('/legends')
    }
  }, [connectedAccount, navigate])

  // If it's connected, don't show the connect button
  if (connectedAccount) return null

  if (!window.ambire)
    return (
      <>
        <a
          href="https://chromewebstore.google.com/detail/ambire-wallet/ehgjhhccekdedpbkifaojjaefeohnoea?hl=en"
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Install Ambire
        </a>
        <p className={styles.text}>*Please, reload this tab after installing Ambire</p>
      </>
    )

  return (
    <>
      <button type="button" onClick={requestAccounts} className={styles.button}>
        Connect Ambire
      </button>
      <p className={styles.text}>*Only Ambire V2 accounts can earn points</p>
    </>
  )
}

export default WalletConnect
