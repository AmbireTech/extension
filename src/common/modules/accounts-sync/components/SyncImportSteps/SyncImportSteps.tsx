import React, { useCallback, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const DOT_SIZE = 8
const DOT_ACTIVE_WIDTH = 20

export interface SyncImportStep {
  id: string
  /** The design's illustration (image or animation) of what to do on the other device */
  illustration: React.ReactNode
  content: React.ReactNode
}

interface Props {
  steps: SyncImportStep[]
  /** Label of the button on the last step, which starts the scanning */
  finishText: string
  finishIcon?: React.ReactNode
  onFinish: () => void
  style?: ViewStyle
}

/**
 * Walks the user through what to do on the other Ambire product before scanning its QR
 * codes. Shown by both products, in the onboarding flow and when syncing later on, so
 * the steps themselves (copy and illustrations) are passed in by the platform screen.
 */
const SyncImportSteps = ({ steps, finishText, finishIcon, onFinish, style }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [stepIndex, setStepIndex] = useState(0)

  const isLastStep = stepIndex === steps.length - 1
  const step = steps[stepIndex]

  const handleNext = useCallback(() => {
    if (isLastStep) return onFinish()

    setStepIndex((prevIndex) => prevIndex + 1)
  }, [isLastStep, onFinish])

  if (!step) return null

  return (
    <View style={style}>
      <View
        style={[
          flexbox.center,
          spacings.pvSm,
          spacings.mbLg,
          { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_PRIMARY }
        ]}
      >
        {step.illustration}
      </View>
      {step.content}
      <View style={[flexbox.directionRow, flexbox.center, spacings.mtLg, spacings.mbSm]}>
        {steps.map(({ id }, index) => (
          <View
            key={id}
            style={{
              width: index === stepIndex ? DOT_ACTIVE_WIDTH : DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              marginHorizontal: 2,
              backgroundColor: index === stepIndex ? theme.secondaryText : theme.secondaryBorder
            }}
          />
        ))}
      </View>
      <Button
        testID={isLastStep ? 'sync-import-start-scanning' : 'sync-import-next-step'}
        type={isLastStep ? 'primary' : 'secondary'}
        text={isLastStep ? finishText : t('Next')}
        onPress={handleNext}
        hasBottomSpacing={false}
        childrenPosition="left"
      >
        {isLastStep ? finishIcon : null}
      </Button>
    </View>
  )
}

export default React.memo(SyncImportSteps)
