import React, { useEffect, useRef, useState } from 'react'
import { Animated, View } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import { formatScore, Icon, Stat } from '@common/components/RewardsStat'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { isWeb } from '@common/config/env'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = Stat & {
  isLast?: boolean
}

const INITIAL_DELAY = 200
const FADE_IN_DURATION = 350
const DELAY_BETWEEN_ANIMATIONS = 400

export const TOTAL_COUNTER_DELAY = INITIAL_DELAY + FADE_IN_DURATION + DELAY_BETWEEN_ANIMATIONS

const SCORE_ANIMATION_DURATION = 1000
const HIDE_SCORE_CHANGE_DELAY = 800

export const getDynamicTimings = (scoreChange: number) => {
  // The more the scoreChange, the longer the animation duration
  const scoreAnimationDuration =
    SCORE_ANIMATION_DURATION + Math.min(scoreChange * 10, SCORE_ANIMATION_DURATION)
  const hideScoreChangeDelay =
    HIDE_SCORE_CHANGE_DELAY + Math.min(scoreChange * 10, HIDE_SCORE_CHANGE_DELAY)

  return {
    scoreAnimationDuration,
    hideScoreChangeDelay
  }
}

const getInitialScore = (
  scoreChange: Stat['scoreChange'],
  score: Stat['score'],
  id: Stat['id']
) => {
  if (!scoreChange || scoreChange <= 0) return formatScore(id, score)

  const oldScore = score - scoreChange

  return formatScore(id, oldScore)
}

const StatItem = ({ id, score, label, explanation, value, isLast, scoreChange }: Props) => {
  const changeOpacity = useRef(new Animated.Value(0)).current
  const changeTranslateY = useRef(new Animated.Value(8)).current
  const animatedScore = useRef(new Animated.Value(0)).current
  const shouldAnimate = !!scoreChange && scoreChange > 0
  const [displayScore, setDisplayScore] = useState(getInitialScore(scoreChange, score, id))

  useEffect(() => {
    if (!shouldAnimate) return

    const startValue = score - scoreChange
    const endValue = score

    animatedScore.setValue(startValue)

    const { scoreAnimationDuration, hideScoreChangeDelay } = getDynamicTimings(scoreChange)

    // Fade in the scoreChange badge
    const phase1Timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(changeOpacity, {
          toValue: 1,
          duration: FADE_IN_DURATION,
          useNativeDriver: !isWeb
        }),
        Animated.timing(changeTranslateY, {
          toValue: 0,
          duration: FADE_IN_DURATION,
          useNativeDriver: !isWeb
        })
      ]).start()
    }, INITIAL_DELAY)

    // After scoreChange appears, animate score counting + fade out scoreChange
    const phase2Timer = setTimeout(() => {
      Animated.timing(animatedScore, {
        toValue: endValue,
        duration: scoreAnimationDuration,
        useNativeDriver: !isWeb
      }).start()

      Animated.timing(changeOpacity, {
        toValue: 0,
        delay: hideScoreChangeDelay,
        duration: scoreAnimationDuration,
        useNativeDriver: !isWeb
      }).start()
    }, TOTAL_COUNTER_DELAY)

    // Listen to animated value changes and update display
    const listenerId = animatedScore.addListener(({ value: scoreValue }) => {
      const formattedValue =
        id === 'multiplier' ? `${scoreValue.toFixed(3)}x` : scoreValue.toFixed(0)
      setDisplayScore(formattedValue)
    })

    return () => {
      clearTimeout(phase1Timer)
      clearTimeout(phase2Timer)
      animatedScore.removeListener(listenerId)
    }
  }, [score, scoreChange, id, changeOpacity, changeTranslateY, animatedScore, shouldAnimate])

  // When there is no positive scoreChange (no animation), keep displayScore in sync with score
  useEffect(() => {
    if (shouldAnimate) {
      // Animation effect will handle updating displayScore
      return
    }

    setDisplayScore(getInitialScore(scoreChange, score, id))
  }, [score, scoreChange, id, shouldAnimate])

  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        borderBottomColor: '#6A6F8633',
        borderBottomWidth: isLast ? 0 : 2,
        paddingVertical: 6
      }}
    >
      <View style={{ flex: 0.2 }}>
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 80,
            width: 'fit-content',
            height: 32,
            backgroundColor: '#101114',
            borderRadius: 20,
            ...spacings.phSm
          }}
        >
          <Text
            weight="semiBold"
            style={{
              fontSize: 16,
              color: 'transparent',
              textAlign: 'center',
              // @ts-ignore
              background: 'linear-gradient(27.42deg, #00d5ff 19.16%, #a25aff 74.07%)',
              backgroundClip: 'text'
            }}
          >
            {displayScore}
          </Text>
          {shouldAnimate && (
            <Animated.View
              style={{
                position: 'absolute',
                top: -4,
                right: -12,
                opacity: changeOpacity,
                transform: [{ translateY: changeTranslateY }]
              }}
            >
              <Text fontSize={13} color="#D7FF00" weight="semiBold">
                +{scoreChange.toFixed(3)}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
      <View style={{ flex: 0.6, ...flexbox.directionRow, ...flexbox.alignCenter }}>
        <Icon id={id} />
        <Text color="#fff" fontSize={13} weight="medium" style={{ ...spacings.mhTy }}>
          {label}
        </Text>
        <InfoIcon color="#54597A" data-tooltip-id={`tooltip-${id}`} width={14} height={14} />
        <Tooltip
          id={`tooltip-${id}`}
          content={explanation}
          style={{
            whiteSpace: 'pre-wrap',
            backgroundColor: '#101114',
            color: '#f4f4f7'
          }}
          border="#6A6F8633"
        />
      </View>
      <Text
        color="#fff"
        style={{
          textAlign: 'right',
          flex: 0.2,
          alignItems: 'flex-end'
        }}
        fontSize={13}
      >
        {value}
      </Text>
    </View>
  )
}

export default StatItem
