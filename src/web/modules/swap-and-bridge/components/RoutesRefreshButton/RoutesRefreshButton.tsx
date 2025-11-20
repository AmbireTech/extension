import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, Easing, Pressable, View } from 'react-native'
import { Circle, G, Path, Svg, SvgProps } from 'react-native-svg'

import { UPDATE_SWAP_AND_BRIDGE_QUOTE_INTERVAL } from '@ambire-common/consts/intervals'
import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'

const radius = 9.5
const strokeWidth = 1
const circumference = 2 * Math.PI * radius

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const RoutesRefreshButton = ({ width = 32, height = 32 }: SvgProps) => {
  const [progress, setProgress] = useState(0)
  const { dispatch } = useBackgroundService()
  const { updateQuoteStatus, formStatus } = useSwapAndBridgeControllerState()
  const prevUpdateQuoteStatus = usePrevious(updateQuoteStatus)
  const { t } = useTranslation()
  const { theme } = useTheme()
  const timer: any = useRef(null)

  useEffect(() => {
    if (prevUpdateQuoteStatus === 'LOADING' && updateQuoteStatus === 'INITIAL') {
      const interval = 100
      const step = (100 / UPDATE_SWAP_AND_BRIDGE_QUOTE_INTERVAL) * interval

      let currentProgress = 0
      !!timer.current && clearInterval(timer.current)
      setProgress(0)
      timer.current = setInterval(() => {
        currentProgress += step
        if (currentProgress >= 100) {
          !!timer.current && clearInterval(timer.current)
          currentProgress = 100
        }
        setProgress(currentProgress)
      }, interval)
    }
  }, [prevUpdateQuoteStatus, updateQuoteStatus])

  useEffect(() => {
    return () => {
      !!timer.current && clearInterval(timer.current)
    }
  }, [])

  const offset = useMemo(() => (progress / 100) * circumference, [progress])

  const spinAnimation = useState(new Animated.Value(1))[0]

  useEffect(() => {
    if (updateQuoteStatus === 'LOADING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(spinAnimation, {
            toValue: 0,
            duration: 450,
            easing: Easing.linear,
            useNativeDriver: false
          }),
          Animated.timing(spinAnimation, {
            toValue: 1,
            duration: 450,
            easing: Easing.linear,
            useNativeDriver: false
          })
        ])
      ).start()
    } else {
      spinAnimation.stopAnimation()
    }
  }, [updateQuoteStatus, spinAnimation])

  const opacityInterpolation = spinAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.65]
  })

  const handleOnPress = useCallback(() => {
    dispatch({
      type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_QUOTE'
    })
  }, [dispatch])

  const opacity = useMemo(() => {
    if (formStatus !== SwapAndBridgeFormStatus.ReadyToSubmit) {
      return 0
    }
    if (updateQuoteStatus === 'LOADING') return opacityInterpolation

    return 1
  }, [formStatus, opacityInterpolation, updateQuoteStatus])

  return (
    <AnimatedPressable
      onPress={handleOnPress}
      style={{ opacity }}
      disabled={updateQuoteStatus === 'LOADING'}
      // @ts-ignore
      dataSet={createGlobalTooltipDataSet({
        id: 'export-icon-tooltip',
        content: t('Routes auto-refresh every 60 secs.'),
        place: 'right',
        style: { backgroundColor: theme.primaryBackground } as any
      })}
    >
      <Svg width={width} height={height} viewBox="0 0 22 22">
        {/* Background circle */}
        <Circle
          cx="11"
          cy="11"
          r={radius - 1.5}
          stroke={theme.iconPrimary}
          fill="none"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <Circle
          cx="11"
          cy="11"
          r={radius}
          stroke="#8B3DFF99"
          fill="none"
          strokeWidth={strokeWidth + 1}
          strokeDasharray={circumference}
          strokeDashoffset={-offset}
          transform="rotate(-90 11 11)"
        />
        <G transform="translate(-3.5 -3.5)">
          <Path
            id="Path_17702"
            data-name="Path 17702"
            d="M18.208,13.461s.634-.312-1.667-.312a4.167,4.167,0,1,0,4.167,4.167"
            transform="translate(-2.042 -2.242)"
            fill="none"
            stroke="#54597a"
            strokeLinecap="round"
            strokeWidth="1"
          />
          <Path
            id="Path_17703"
            data-name="Path 17703"
            d="M18,10.477l2.083,2.083L18,14.643"
            transform="translate(-3.5 -1.55)"
            fill="none"
            stroke="#54597a"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1"
          />
        </G>
      </Svg>
    </AnimatedPressable>
  )
}

export default React.memo(RoutesRefreshButton)
