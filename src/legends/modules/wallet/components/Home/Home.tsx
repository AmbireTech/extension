import React, { useEffect, useMemo, useState } from 'react'

import OverachieverBanner from '@legends/components/OverachieverBanner'
import V1AccountBanner from '@legends/components/V1AccountBanner'
import usePortfolioControllerState from '@legends/hooks/usePortfolioControllerState/usePortfolioControllerState'

import walletCoin from './assets/wallet-coin.png'
import styles from './Home.module.scss'

// Formats a number as 1.23B, 4.56M, 7.89K, or with commas for smaller numbers
function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2).replace(/\.00$/, '')}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2).replace(/\.00$/, '')}K`
  }
  return value.toLocaleString('en-US')
}

const Home = () => {
  const [isWidgetReady, setIsWidgetReady] = useState(false)
  // Use a callback ref for more reliable access to the custom element
  const [widgetEl, setWidgetEl] = useState<HTMLElement | null>(null)
  const widgetRef = React.useCallback((node: HTMLElement | null) => {
    if (node) setWidgetEl(node)
  }, [])

  const { walletTokenInfo, isLoadingWalletTokenInfo } = usePortfolioControllerState()
  const stakedWallet = walletTokenInfo && walletTokenInfo.percentageStakedWallet

  const marketCapFormatted = useMemo(() => {
    if (walletTokenInfo?.walletPrice !== undefined && walletTokenInfo?.totalSupply !== undefined) {
      const marketCap = walletTokenInfo.walletPrice * walletTokenInfo.totalSupply
      return formatMarketCap(marketCap)
    }
    return ''
  }, [walletTokenInfo?.walletPrice, walletTokenInfo?.totalSupply])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://widgets.coingecko.com/gecko-coin-price-chart-widget.js'
    script.async = true
    document.body.appendChild(script)

    // Mark widget ready once the custom element is defined to avoid layout shift
    const tagName = 'gecko-coin-price-chart-widget'
    if (typeof window !== 'undefined' && 'customElements' in window) {
      if (customElements.get(tagName)) {
        setIsWidgetReady(true)
      } else {
        customElements
          .whenDefined(tagName)
          .then(() => setIsWidgetReady(true))
          .catch(() => {})
      }
    }

    // Attach style to widget's shadowRoot when available
    let observer: MutationObserver | null = null
    function injectStyleToShadowRoot(target: HTMLElement) {
      if (target.shadowRoot) {
        const style = document.createElement('style')
        style.textContent = `
          .gecko-coin-details {
            padding: 0 !important;
          }

          .highcharts-color-negative {
            fill: var(--color-success-400);
            stroke: var(--color-success-400) !important;
          }

          .highcharts-area-series.highcharts-color-negative, .highcharts-area.zone-negative {
            fill: url(#gecko-chart-positive-gradient);
          }
        `
        target.shadowRoot.appendChild(style)
        return true
      }
      return false
    }

    if (widgetEl) {
      // Try immediately
      if (!injectStyleToShadowRoot(widgetEl)) {
        // If shadowRoot not present, observe for it
        observer = new MutationObserver(() => {
          if (widgetEl.shadowRoot) {
            injectStyleToShadowRoot(widgetEl)
            if (observer) observer.disconnect()
          }
        })
        observer.observe(widgetEl, { childList: true })
      }
    }

    return () => {
      setIsWidgetReady(false)
      if (observer) observer.disconnect()
      if (script.parentNode) {
        script.parentNode.removeChild(script) // cleanup on unmount
      }
    }
  }, [widgetEl])

  return (
    <>
      <div className={styles.overachieverWrapper}>
        <V1AccountBanner />
        {/* TODO: Consider deleting the banner as it's likely no longer needed */}
        <OverachieverBanner wrapperClassName={styles.overachieverBanner} />
      </div>
      <section className={`${styles.wrapper}`}>
        <div className={styles.walletInfo}>
          <div className={styles.chartWrapper}>
            {isWidgetReady ? (
              <div
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onClick={() => {
                  window.open(
                    'https://www.coingecko.com/en/coins/ambire-wallet',
                    '_blank',
                    'noopener,noreferrer'
                  )
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    window.open(
                      'https://www.coingecko.com/en/coins/ambire-wallet',
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                }}
                title="View on CoinGecko"
              >
                {/* @ts-ignore - Custom element from CoinGecko widget */}
                <gecko-coin-price-chart-widget
                  ref={widgetRef}
                  locale="en"
                  dark-mode="true"
                  transparent-background="true"
                  coin-id="ambire-wallet"
                  initial-currency="usd"
                  width="440"
                />
              </div>
            ) : (
              // Empty placeholder to reserve space and prevent layout shift while loading
              <div aria-hidden="true" className={styles.placeholder} />
            )}
          </div>

          <div className={styles.walletLevelInfoWrapper}>
            <div className={styles.walletItemWrapper}>
              <span className={styles.item}>
                {isLoadingWalletTokenInfo
                  ? 'Loading...'
                  : stakedWallet === null
                  ? 0
                  : `${stakedWallet.toFixed(2)}%`}
              </span>
              Staked $WALLET
              <div className={styles.walletInfoWrapper} />
            </div>

            <div className={styles.walletItemWrapper}>
              <span className={styles.item}>
                {isLoadingWalletTokenInfo
                  ? 'Loading...'
                  : walletTokenInfo?.apy === null || walletTokenInfo?.apy === undefined
                  ? '0%'
                  : `${walletTokenInfo.apy.toFixed(2)}%`}
              </span>
              Staking APY
              <div className={styles.walletInfoWrapper} />
            </div>

            <div className={styles.walletItemWrapper}>
              <span className={styles.item}>
                {isLoadingWalletTokenInfo ? 'Loading...' : marketCapFormatted}
              </span>
              <div className={styles.walletInfoWrapper}>Market Cap</div>
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
