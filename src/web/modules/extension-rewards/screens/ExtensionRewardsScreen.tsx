import React from 'react'
import { View } from 'react-native'

import AmbireBrandLogo from '@common/assets/svg/AmbireBrandLogo'
import { getValueFromKey, SECTIONS, Stat } from '@common/components/RewardsStat'
import SkeletonLoaderWeb from '@common/components/SkeletonLoader/SkeletonLoader.web'
import Text from '@common/components/Text'
import HeaderBackButton from '@common/modules/header/components/HeaderBackButton'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import RewardsAndStats from '../components/RewardsAndStats'
import StatItem from '../components/StatItem'
import StatsHeading from '../components/StatsHeading'

const ExtensionRewardsScreen = () => {
  const { portfolio } = useSelectedAccountControllerState()

  const isProjectedRewardsLoading =
    portfolio.portfolioState.projectedRewards?.isLoading && !portfolio.isAllReady
  const projectedRewardsStats = portfolio.projectedRewardsStats

  const sections: Stat[] = SECTIONS.map((section) => {
    let score = projectedRewardsStats ? projectedRewardsStats[section.id].toFixed(0) : 0

    if (section.id === 'multiplier') {
      score = `${score}x`
    }

    return {
      ...section,
      score,
      value: getValueFromKey(section.id, projectedRewardsStats)
    }
  })

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
          <HeaderBackButton color="#8E98A8" displayIn="always" />
          <Text color="#fff" weight="medium" fontSize={16}>
            Ambire Rewards
          </Text>
          <AmbireBrandLogo />
        </View>
        {!isProjectedRewardsLoading ? (
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
              {sections.map((stat, index) => (
                <StatItem key={stat.id} {...stat} isLast={index === sections.length - 1} />
              ))}
            </View>
            <RewardsAndStats />
          </View>
        ) : (
          <SkeletonLoaderWeb width="100%" height={420} style={{ backgroundColor: '#101114' }} />
        )}
      </View>
    </View>
  )
}

export default ExtensionRewardsScreen
