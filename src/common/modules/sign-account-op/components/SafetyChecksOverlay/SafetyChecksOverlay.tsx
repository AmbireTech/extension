import { BlurView } from 'expo-blur'
import React, { FC, useEffect, useRef, useState } from 'react'
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
  const [prevShouldBeVisible, setPrevShouldBeVisible] = useState(shouldBeVisible)
  const startedLoadingTimestampRef = useRef<number | null>(null)

  if (shouldBeVisible !== prevShouldBeVisible) {
    setPrevShouldBeVisible(shouldBeVisible)
    if (shouldBeVisible) setIsOverlayActuallyVisible(true)
  }

  // Depends on `shouldBeVisible` alone, so that hiding the overlay doesn't re-run
  // this effect and bring the overlay back while the checks are still loading
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    if (shouldBeVisible) {
      startedLoadingTimestampRef.current = Date.now()

      timeout = setTimeout(() => setIsOverlayActuallyVisible(false), MAX_DISPLAY_TIME)
    } else {
      const timeDifference = startedLoadingTimestampRef.current
        ? Date.now() - startedLoadingTimestampRef.current
        : MIN_DISPLAY_TIME
      // Either a delay of 0 or the time left until the minimum display time is reached
      const delay = Math.max(MIN_DISPLAY_TIME - timeDifference, 0)

      timeout = setTimeout(() => setIsOverlayActuallyVisible(false), delay)
    }

    return () => {
      clearTimeout(timeout)
    }
  }, [shouldBeVisible])

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
