import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AmbireBrandLogo from '@common/assets/svg/AmbireBrandLogo'
import Text from '@common/components/Text'
import HeaderBackButton from '@common/modules/header/components/HeaderBackButton'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import RewardsAndStats from '../components/RewardsAndStats'
import StatItem from '../components/StatItem'
import { Stat } from '../components/StatItem/StatItem'
import StatsHeading from '../components/StatsHeading'

// @TODO: Get rid of mock data
const MOCK_STATS: Stat[] = [
  {
    id: 'balance',
    score: 1200,
    label: 'Wallet Balance (AVG)',
    explanation: 'Average wallet balance over the last 30 days.',
    description: 'This is calculated based on daily snapshots of your wallet balance.',
    value: '$5,432.10'
  },
  {
    id: 'liquidity',
    score: 950,
    label: 'Concentrated Liquidity (AVG)',
    explanation: 'Average liquidity provided in concentrated pools over the last 30 days.',
    description: 'This reflects your participation in liquidity pools with specific price ranges.',
    value: '$3,210.75'
  },
  {
    id: 'staked',
    score: 1100,
    label: 'Staked $WALLET (AVG)',
    explanation: 'Average value of $WALLET staked over the last 30 days.',
    description: 'Staking $WALLET helps secure the network and earn rewards.',
    value: '$1,250.00'
  }
]

const MOCK_DATA = {
  totalScore: 617,
  rewards: {
    amount: 120845.01,
    usd: 1234
  }
}

const ExtensionRewardsScreen = () => {
  const { t } = useTranslation()
  return (
    <View style={[flexbox.flex1, { backgroundColor: '#101114' }, spacings.ph, spacings.pv]}>
      <View
        style={{
          maxWidth: 540,
          width: '100%',
          marginHorizontal: 'auto',
          ...flexbox.flex1
        }}
      >
        <View
          style={{
            ...flexbox.directionRow,
            ...flexbox.alignCenter,
            ...flexbox.justifySpaceBetween,
            ...spacings.mbLg
          }}
        >
          <HeaderBackButton displayIn="always" />
          <Text color="#fff" weight="medium" fontSize={16}>
            Ambire Rewards
          </Text>
          <AmbireBrandLogo />
        </View>
        <View
          style={{
            ...spacings.phLg,
            ...spacings.pbSm,
            ...spacings.ptMd,
            backgroundColor: '#191A1F',
            borderWidth: 1,
            borderColor: '#6A6F8633',
            borderRadius: 16
          }}
        >
          <StatsHeading />
          <View style={spacings.mb}>
            {MOCK_STATS.map((stat, index) => (
              <StatItem key={stat.id} {...stat} isLast={index === MOCK_STATS.length - 1} />
            ))}
          </View>
          <RewardsAndStats />
        </View>
      </View>
    </View>
  )
}

export default ExtensionRewardsScreen
