import React, { FC } from 'react'

import ArbitrumLogo from '@legends/components/NetworkIcons/ArbitrumLogo'
import BaseLogo from '@legends/components/NetworkIcons/BaseLogo'
import BinanceSmartChainLogo from '@legends/components/NetworkIcons/BinanceSmartChainLogo'
import EthereumLogo from '@legends/components/NetworkIcons/EthereumLogo'
import OptimismLogo from '@legends/components/NetworkIcons/OptimismLogo'
import ScrollLogo from '@legends/components/NetworkIcons/ScrollLogo'
import { CardFromResponse, CardXp } from '@legends/modules/legends/types'

import styles from './Rewards.module.scss'

type Props = Pick<CardFromResponse, 'xp' | 'id'> & {
  size: 'sm' | 'lg'
  reverse?: boolean
}

const NETWORK_ICONS: { [networkId: string]: React.ReactNode } = {
  ethereum: <EthereumLogo />,
  base: <BaseLogo />,
  arbitrum: <ArbitrumLogo />,
  optimism: <OptimismLogo />,
  scroll: <ScrollLogo />,
  'binance-smart-chain': <BinanceSmartChainLogo />
}

function getText({ from, to, linearMultiplier }: Partial<CardXp>): string {
  if (linearMultiplier) return `${linearMultiplier} XP per $1 used`
  if (from !== to) `${from} - ${to} XP`
  return `${from} XP`
}

const Rewards: FC<Props> = ({ xp, size = 'lg', reverse, id }) => {
  return (
    <div className={`${styles.wrapper} ${styles[size]} ${reverse ? styles.reverse : ''}`}>
      {xp?.map(({ from, to, type, chains, linearMultiplier }) => (
        <div key={`${from}-${to}-${type}`} className={styles.item}>
          {chains && (
            <div className={styles.itemNetworks}>
              {chains.map((chain) => (
                <React.Fragment key={chain}>{NETWORK_ICONS[chain]}</React.Fragment>
              ))}
            </div>
          )}
          <div className={styles.itemText}>
            {id !== 'cant-get-enough' ? (
              getText({ from, to, linearMultiplier })
            ) : (
              <>
                <p>50 - 500 XP (daily)</p>
                <p>100 - 500 XP (weekly)</p>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Rewards
