import React, { FC } from 'react'

import styles from './ErrorPage.module.scss'

type Props = {
  title?: string
  error?: string
}

const ErrorPage: FC<Props> = ({ title = 'Oops. Something went wrong!', error }) => {
  const onButtonClick = () => {
    window.location.reload()
  }

  return (
    <div className={styles.wrapper}>
      <img src="/images/logo.png" alt="Legends Logo" className={styles.logo} />
      <h1 className={styles.title}>{title}</h1>
      {error && <h2 className={styles.error}>{error}</h2>}
      <h3 className={styles.subtitle}>
        Please reload the page. If the issue continues, contact support for assistance.
      </h3>
      <button onClick={onButtonClick} type="button" className={styles.button}>
        Reload
      </button>
    </div>
  )
}

export default ErrorPage
