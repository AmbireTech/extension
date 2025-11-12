import React, { FC } from 'react'

import useProviderContext from '@legends/hooks/useProviderContext'

import ambireBlurredLogo from './ambire-blurred-logo.png'
import ambireLogoGlass from './ambire-logo-glass.png'
import ambireLogoSmall from './ambire-logo-small.png'
import styles from './LandingSection.module.scss'

type Props = {
  nonV2acc?: boolean
}

const LandingSection: FC<Props> = ({ nonV2acc = false }) => {
  const { connectProvider, hasAnyAmbireExtensionInstalled } = useProviderContext()

  const onButtonClick = async () => {
    if (hasAnyAmbireExtensionInstalled) {
      await connectProvider()
    } else {
      window.open(
        'https://chromewebstore.google.com/detail/ambire-wallet/ehgjhhccekdedpbkifaojjaefeohnoea',
        '_blank'
      )
    }
  }

  return (
    <section className={`${styles.wrapper} ${nonV2acc ? styles.nonV2 : styles.v2}`}>
      <div className={styles.heroSection}>
        <span className={styles.kicker}>Welcome to Ambire Rewards</span>
        <h1 className={styles.title}>
          {nonV2acc
            ? 'Switch to a new account to unlock Rewards quests. Ambire legacy accounts not supported.'
            : 'Complete onchain quests, collect XP, claim $WALLET tokens!'}
        </h1>

        {!nonV2acc && (
          <button className={styles.button} type="button" onClick={onButtonClick}>
            <img src={ambireLogoSmall} alt="Ambire Logo" className={styles.logoSmall} />
            {!hasAnyAmbireExtensionInstalled ? 'Get the Extension' : 'Connect Ambire'}{' '}
          </button>
        )}

        <img src={ambireLogoGlass} alt="Ambire Logo" className={styles.logoGlass} />
      </div>
      <div
        className={styles.logoBlurEffect}
        style={{ backgroundImage: `url(${ambireBlurredLogo})` }}
      />
    </section>
  )
}

export default React.memo(LandingSection)
