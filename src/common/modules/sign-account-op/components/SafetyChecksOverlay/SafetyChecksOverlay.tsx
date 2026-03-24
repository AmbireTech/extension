import { BlurView } from 'expo-blur'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import SecurityIcon from '@common/assets/svg/SecurityIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import styles from './styles'

interface Props {
  shouldBeVisible: boolean
}

const MAX_DISPLAY_TIME = 2500
const MIN_DISPLAY_TIME = 500

const SafetyChecksOverlay: FC<Props> = ({ shouldBeVisible }) => {
  const { t } = useTranslation()
  const [isOverlayActuallyVisible, setIsOverlayActuallyVisible] = useState(shouldBeVisible)
  const [startedLoadingTimestamp, setStartedLoadingTimestamp] = useState<number | null>(null)

  const handleHide = useCallback(() => {
    setIsOverlayActuallyVisible(false)
  }, [])

  useEffect(() => {
    if (shouldBeVisible && !isOverlayActuallyVisible && startedLoadingTimestamp) return
    let timeout: any
    const now = Date.now()

    if (shouldBeVisible) {
      setStartedLoadingTimestamp(now)
      setIsOverlayActuallyVisible(true)

      timeout = setTimeout(handleHide, MAX_DISPLAY_TIME)
    } else if (!shouldBeVisible && isOverlayActuallyVisible && startedLoadingTimestamp) {
      const timeDifference = now - startedLoadingTimestamp
      // Either a delay of 0 or the difference between the current time and the time the loading started
      const delay = Math.max(MIN_DISPLAY_TIME - timeDifference, 0)

      timeout = setTimeout(handleHide, delay)
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [handleHide, isOverlayActuallyVisible, shouldBeVisible, startedLoadingTimestamp])

  if (!isOverlayActuallyVisible) return null

  return (
    <BlurView intensity={24} tint="light" style={styles.container}>
      <Text weight="semiBold" fontSize={20} style={spacings.mbLg}>
        {t('Safety Checks')}
      </Text>
      <View style={flexbox.center}>
        <Spinner style={styles.spinner} />
        <View style={styles.iconContainer}>
          <SecurityIcon width={51.2} height={64} />
        </View>
      </View>
    </BlurView>
  )
}

export default SafetyChecksOverlay
