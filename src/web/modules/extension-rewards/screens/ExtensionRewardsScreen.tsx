import React, { memo, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import BadgeIcon from '@common/assets/svg/BadgeIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import { getValueFromKey, SECTIONS, Stat } from '@common/components/RewardsStat'
import SkeletonLoaderWeb from '@common/components/SkeletonLoader/SkeletonLoader.web'
import Text from '@common/components/Text'
import { APP_VERSION } from '@common/config/env'
import HeaderBackButton from '@common/modules/header/components/HeaderBackButton'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import RewardsAndStats from '../components/RewardsAndStats'
import StatItem from '../components/StatItem'
import StatsHeading from '../components/StatsHeading'

const { isPopup } = getUiType()

/**
 * The storage structure of `PastProjectedRewardsScores`
 */
type PastProjectedRewardsScoresStorage = {
  extensionVersion: string
  data: {
    [accountAddr: string]: {
      [key in Stat['id']]: number
    }
  }
}

/**
 * Past projected rewards scores stored per account,
 * used to display a cool animation when the score changes.
 */
type PastProjectedRewardsScores = {
  accountAddr: string
  scores: {
    [key in Stat['id']]: number
  }
}

/**
 * The screen is styled to match the design of rewards.ambire.com
 * It uses the same color scheme. This is why we are not using the useTheme
 * hook here and colors are hardcoded.
 */
const ExtensionRewardsScreen = () => {
  const { portfolio, account } = useSelectedAccountControllerState()
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  const projectedRewardsStats = portfolio.projectedRewardsStats
  const [pastProjectedRewardsScores, setPastProjectedRewardsScores] =
    useState<PastProjectedRewardsScores | null>(null)
  const [arePastProjectedRewardsScoresLoading, setArePastProjectedRewardsScoresLoading] =
    useState(true)
  const isProjectedRewardsLoading =
    !portfolio.portfolioState.projectedRewards?.isReady || arePastProjectedRewardsScoresLoading

  const sections: Stat[] = useMemo(
    () =>
      SECTIONS.map((section) => {
        let score = 0
        if (projectedRewardsStats) {
          if (section.id === 'multiplier')
            score = Math.floor(projectedRewardsStats[section.id] * 1000) / 1000
          else score = Math.floor(projectedRewardsStats[section.id])
        }
        let scoreChange = 0

        if (pastProjectedRewardsScores && projectedRewardsStats) {
          const pastValue = pastProjectedRewardsScores.scores[section.id]
          const currentValue = projectedRewardsStats[section.id]

          if (typeof pastValue === 'number' && typeof currentValue === 'number') {
            scoreChange = currentValue - pastValue
          }
        }

        let explanation = section.explanation
        if (section.id === 'multiplier') {
          if (projectedRewardsStats?.multipliers) {
            explanation = projectedRewardsStats.multipliers.map((m) => m.description).join('\n')
          }
        }

        return {
          ...section,
          explanation,
          score,
          scoreChange,
          value: getValueFromKey(section.id, projectedRewardsStats)
        }
      }),
    [pastProjectedRewardsScores, projectedRewardsStats]
  )

  // Read past projected rewards scores from storage
  useEffect(() => {
    if (pastProjectedRewardsScores && account?.addr === pastProjectedRewardsScores.accountAddr)
      return

    const storageData = localStorage.getItem('pastProjectedRewardsScores') as string | undefined
    const parsed = storageData ? (parse(storageData) as PastProjectedRewardsScoresStorage) : null

    if (!parsed || parsed.extensionVersion !== APP_VERSION || !account) {
      setArePastProjectedRewardsScoresLoading(false)
      return
    }

    const scores = parsed.data[account.addr]

    if (!scores) {
      setArePastProjectedRewardsScoresLoading(false)
      return
    }

    setPastProjectedRewardsScores({
      accountAddr: account.addr,
      scores
    })
    setArePastProjectedRewardsScoresLoading(false)
  }, [account, pastProjectedRewardsScores])

  // Store the projected rewards scores when unmounting the screen
  useEffect(() => {
    return () => {
      if (!projectedRewardsStats || !account) return

      const prevData = localStorage.getItem('pastProjectedRewardsScores') as string | undefined
      const parsed = prevData ? (parse(prevData) as PastProjectedRewardsScoresStorage) : null

      // There are no bigint values atm, but use richJson just in case
      localStorage.setItem(
        'pastProjectedRewardsScores',
        stringify({
          extensionVersion: APP_VERSION,
          data: {
            ...(parsed?.data || {}),
            [account.addr]: projectedRewardsStats
          }
        })
      )
    }
  }, [account, projectedRewardsStats])

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

          <AnimatedPressable
            {...bindAnim}
            onPress={async () => {
              await openInTab({
                url: 'https://rewards.ambire.com/',
                shouldCloseCurrentWindow: isPopup
              })
            }}
            style={{
              ...animStyle,
              ...flexbox.directionRow,
              ...flexbox.alignCenter,
              ...flexbox.justifyCenter,
              ...spacings.pvTy,
              ...spacings.ph,
              backgroundColor: '#6A6F864D',
              borderRadius: 16
            }}
          >
            <BadgeIcon width={24} height={24} />
            <Text
              fontSize={16}
              weight="medium"
              style={{
                ...spacings.mlTy,
                ...spacings.mr
              }}
              color="#fff"
            >
              Ambire Rewards
            </Text>
            <OpenIcon width={18} height={18} color="#8D93AC" />
          </AnimatedPressable>
        </View>
        {!isProjectedRewardsLoading ? (
          <View
            style={{
              ...spacings.phLg,
              ...spacings.pvLg,
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
            <RewardsAndStats
              pastTotalScore={pastProjectedRewardsScores?.scores.totalScore ?? null}
            />
          </View>
        ) : (
          <SkeletonLoaderWeb width="100%" height={420} style={{ backgroundColor: '#191A1F' }} />
        )}
      </View>
    </View>
  )
}

export default memo(ExtensionRewardsScreen)
