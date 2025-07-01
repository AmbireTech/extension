import React from 'react'

import OverachieverBanner from '@legends/components/OverachieverBanner'
import RewardsBadge from '@legends/components/RewardsBadge'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'

import walletCoin from './assets/wallet-coin.png'
import styles from './Home.module.scss'

const Home = () => {
  const { walletTokenInfo, isLoadingWalletTokenInfo } = usePortfolioControllerState()
  const stakedWallet = walletTokenInfo && walletTokenInfo.percentageStakedWallet

  return (
    <>
      <div className={styles.overachieverWrapper}>
        <OverachieverBanner wrapperClassName={styles.overachieverBanner} />
      </div>
      <RewardsBadge />
      <section className={`${styles.wrapper}`}>
        <div className={styles.walletInfo}>
          <h1 className={styles.title}>
            <span className={styles.dollarSign}>$</span>WALLET
          </h1>

          <div className={styles.walletLevelInfoWrapper}>
            <div className={styles.logoAndBalanceWrapper}>
              <div className={styles.walletItemWrapper}>
                <div className={styles.walletItem}>
                  <div className={styles.walletInfoWrapper}>Circulating supply</div>
                  <span className={styles.item}>
                    {isLoadingWalletTokenInfo
                      ? 'Loading...'
                      : walletTokenInfo?.circulatingSupply
                      ? Math.floor(Number(walletTokenInfo.circulatingSupply)).toLocaleString(
                          'en-US'
                        )
                      : '0'}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.walletItemWrapper}>
              <div className={styles.walletItem}>
                Staked $WALLET
                <span className={styles.item}>
                  {isLoadingWalletTokenInfo
                    ? 'Loading...'
                    : stakedWallet === null
                    ? 0
                    : `${stakedWallet.toFixed(2)}%`}
                </span>
                <div className={styles.walletInfoWrapper} />
              </div>
            </div>
            <div className={styles.walletItemWrapper}>
              <div className={styles.walletItem}>
                APY
                <span className={styles.item}>
                  {isLoadingWalletTokenInfo
                    ? 'Loading...'
                    : walletTokenInfo?.apy === null
                    ? 0
                    : `${walletTokenInfo?.apy.toFixed(2)}%`}
                </span>
                <div className={styles.walletInfoWrapper} />
              </div>
            </div>

            <div className={styles.walletItemWrapper}>
              <div className={styles.walletItem}>
                <div className={styles.walletInfoWrapper}>Current price</div>
                <span className={styles.item}>
                  {isLoadingWalletTokenInfo
                    ? 'Loading...'
                    : walletTokenInfo?.walletPrice !== undefined
                    ? `$${Number(walletTokenInfo?.walletPrice).toFixed(3)}`
                    : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          className={styles.walletBlurEffect}
          style={{ backgroundImage: `url(${walletCoin})` }}
        />

        <div className={styles.wallet}>
          <div className={styles.walletRelativeWrapper}>
            <img className={styles.walletImage} src={walletCoin} alt="wallet-coin" />
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
