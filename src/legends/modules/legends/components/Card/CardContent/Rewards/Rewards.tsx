import React, { FC } from 'react'

import ArbitrumLogo from '@legends/components/NetworkIcons/ArbitrumLogo'
import BaseLogo from '@legends/components/NetworkIcons/BaseLogo'
import EthereumLogo from '@legends/components/NetworkIcons/EthereumLogo'
import OptimismLogo from '@legends/components/NetworkIcons/OptimismLogo'
import ScrollLogo from '@legends/components/NetworkIcons/ScrollLogo'
import GoldCoin from '@legends/modules/legends/components/GoldCoin'
import { CardFromResponse, Networks } from '@legends/modules/legends/types'

import styles from './Rewards.module.scss'

type Props = Pick<CardFromResponse, 'xp'> & {
  size: 'sm' | 'lg'
  reverse?: boolean
}

const NETWORK_ICONS: { [key in Networks]: React.ReactNode } = {
  ethereum: <EthereumLogo />,
  base: <BaseLogo />,
  arbitrum: <ArbitrumLogo />,
  optimism: <OptimismLogo />,
  scroll: <ScrollLogo />
}

const Rewards: FC<Props> = ({ xp, size = 'lg', reverse }) => {
  return (
    <div className={`${styles.wrapper} ${styles[size]} ${reverse ? styles.reverse : ''}`}>
      {xp?.map(({ from, to, type, chains }) => (
        <div key={`${from}-${to}-${type}`} className={styles.item}>
          {chains && (
            <div className={styles.itemNetworks}>
              {chains.map((chain) => (
                <React.Fragment key={chain}>{NETWORK_ICONS[chain]}</React.Fragment>
              ))}
            </div>
          )}
          <div className={styles.itemText}>
            {from}
            {to !== from ? `-${to}` : ''} XP
          </div>
          <GoldCoin />
        </div>
      ))}
    </div>
  )
}

export default Rewards
