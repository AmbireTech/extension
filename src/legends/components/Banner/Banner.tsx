import React from 'react'

import { CardFromResponse } from '@legends/modules/legends/types'

import styles from './Banner.module.scss'
import governance from './governance.png'

interface Props {
  activeProposals: NonNullable<NonNullable<CardFromResponse['meta']>['activeProposals']>
}
const emojis = ['🚀', '🔥', '🗣', '📢']
const Banner: React.FC<Props> = ({ activeProposals }) => {

  // @TODO custom banner variance for season 0 claiming can be removed after the specified date
  const shouldDisplayBannerClaimingS0 = Date.now() < new Date('2026-02-27').getTime()
  if (shouldDisplayBannerClaimingS0)
    return (
      <div className={styles.container}>
        <img className={styles.iconPlaceholder} src={governance} alt="Governance banner icon" />
        <div className={styles.textContent}>
          <div className={styles.title}>
            Claim Season 0 rewards before March 1st
          </div>
        </div>
      </div>
    )

  const firstProposal = activeProposals?.[0]

  if (!firstProposal) {
    return null
  }

  return (
    <div className={styles.container}>
      <img className={styles.iconPlaceholder} src={governance} alt="Governance banner icon" />
      <div className={styles.textContent}>
        {activeProposals.length === 1 ? (
          <div className={styles.title}>
            🗳️ {firstProposal.title}{' '}
            <a
              href={`https://snapshot.box/#/s:ambire.eth/proposal/${firstProposal.id}`}
              className={styles.readMoreLink}
              target="_blank"
              rel="noreferrer"
            >
              Vote until{' '}
              {new Date(firstProposal.end * 1000).toLocaleString('en', {
                month: 'long',
                day: 'numeric'
              })}
              !
            </a>
          </div>
        ) : (
          <>
            <div className={styles.title}>
              🗳️ {activeProposals.length} governance proposals are live, vote until{' '}
              {new Date(
                activeProposals.sort((a, b) => a.end - b.end)[0]!.end * 1000
              ).toLocaleString('en', { month: 'long', day: 'numeric' })}
              !
            </div>
            {activeProposals.map(({ id, title }, i) => {
              return (
                <>
                  <a
                    href={`https://snapshot.box/#/s:ambire.eth/proposal/${id}`}
                    className={styles.readMoreLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {emojis[i % emojis.length]} {title}
                  </a>
                  <br />
                </>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

export default Banner
