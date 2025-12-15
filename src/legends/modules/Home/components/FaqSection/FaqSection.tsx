import React from 'react'

import Accordion from '@legends/components/Accordion'

import SectionHeading from '../SectionHeading'
import styles from './FaqSection.module.scss'

const FaqSection = () => {
  const faqData = [
    {
      question: 'What is Ambire Rewards?',
      answer:
        'Ambire Rewards is a loyalty program that lets you earn $WALLET tokens simply by using the Ambire Wallet Extension. The program is divided into seasons, and your onchain activity during each season contributes to your personal score. When a season ends, your score determines how many $WALLET tokens you receive.'
    },
    {
      question: 'Is Ambire Rewards free to participate?',
      answer: 'Yes, participating in Rewards is free.'
    },
    {
      question: 'Can I participate with a wallet different from Ambire?',
      answer: 'No, only Ambire Wallet Extension users are eligible to participate.'
    },
    {
      question: 'Can I use my existing account?',
      answer: `Yes. You can participate with any account you import or create in the Ambire Wallet extension — this includes existing hot EOAs, hardware wallets, and new Ambire (V2) accounts created in the extension.

Ambire legacy accounts from the web wallet or mobile app (V1) are not eligible for Rewards.`
    },
    {
      question: 'Can I participate with multiple accounts?',
      answer: `Yes, you can use more than one account. However, there is no incentive to split your balance across multiple accounts in this season.

That said, if any misuse or sybil-like behavior is detected, the Ambire team may take immediate action, including disqualifying accounts, adjusting score calculations, applying penalties, or other necessary measures. The team reserves the right to disqualify or penalize users for any reason.`
    },
    {
      question: 'How long is the current Ambire Reward season?',
      answer: `Season 2 begins on December 15, 2025. It is planned to run for 90 days, but this depends on the community goal being reached. The goal is to generate $3MM in swap/bridge volume through the built-in Swap & Bridge features in the wallet during the season.

If the goal is not reached within the initial 90 days, the season will be extended following a governance vote.`
    },
    {
      question: 'What are projected rewards?',
      answer:
        'Projected rewards are an estimate of how much $WALLET you might earn based on your current score compared to all other participants. These values change throughout the season as scores update. Projections also assume that the community goal is reached. If the goal is not met, the season is extended. If higher goal levels are reached, the total reward pool increases.'
    }
  ]

  return (
    <div className={styles.wrapper}>
      <SectionHeading>FAQ</SectionHeading>
      {faqData.map((faq) => (
        <Accordion
          key={faq.question}
          title={faq.question}
          titleClassName={styles.accordionTitle}
          wrapperClassName={styles.accordionWrapper}
        >
          <p className={styles.accordionDropdown}>{faq.answer}</p>
        </Accordion>
      ))}
    </div>
  )
}

export default FaqSection
