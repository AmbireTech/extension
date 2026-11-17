import { memo, ReactNode, useCallback } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import type { ViewStyle } from 'react-native'
const DOT_SIZE = 10
const DOT_ACTIVE_WIDTH = 24

export interface SyncImportStep {
  id: string
  /** The design's illustration (image or animation) of what to do on the other device */
  illustration: ReactNode
  content: ReactNode
}

interface Props {
  steps: SyncImportStep[]
  /**
   * The step is controlled by the screen, so its back button can return to the previous
   * step instead of leaving the flow
   */
  stepIndex: number
  style?: ViewStyle
  /**
   * Fixes the height of the card behind the illustration, so it stays the same on every
   * step no matter how tall the illustration of the step is
   */
  illustrationCardStyle?: ViewStyle
}

interface FooterProps extends Props {
  onStepIndexChange: (stepIndex: number) => void
  /** Label of the button on the last step, which starts the scanning */
  finishText: string
  finishIcon?: React.ReactNode
  onFinish: () => void
}

/**
 * Walks the user through what to do on the other Ambire product before scanning its QR
 * codes. Shown by both products, in the onboarding flow and when syncing later on, so
 * the steps themselves (copy and illustrations) are passed in by the platform screen.
 */
const SyncImportSteps = ({ steps, stepIndex, style, illustrationCardStyle }: Props) => {
  const { theme } = useTheme()

  const step = steps[stepIndex]

  if (!step) return null

  return (
    <View style={style}>
      <View
        style={[
          flexbox.center,
          // Enough room for the drop shadow some illustrations have to stay inside the card
          spacings.pvLg,
          spacings.mbLg,
          { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_PRIMARY },
          illustrationCardStyle
        ]}
      >
        {step.illustration}
      </View>
      {step.content}
    </View>
  )
}

/**
 * The pagination dots and the button that advances the steps. Separate from the steps
 * themselves, so the mobile screen can pin it to the bottom of the screen as a footer.
 */
const SyncImportStepsFooter = ({
  steps,
  stepIndex,
  onStepIndexChange,
  finishText,
  finishIcon,
  onFinish,
  style
}: FooterProps) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const isLastStep = stepIndex === steps.length - 1

  const handleNext = useCallback(() => {
    if (isLastStep) return onFinish()

    onStepIndexChange(stepIndex + 1)
  }, [isLastStep, onFinish, onStepIndexChange, stepIndex])

  return (
    <View style={style}>
      <View style={[flexbox.directionRow, flexbox.center, spacings.mbMd]}>
        {steps.map(({ id }, index) => (
          <View
            key={id}
            style={{
              width: index === stepIndex ? DOT_ACTIVE_WIDTH : DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              ...spacings.mhTy,
              backgroundColor: index === stepIndex ? theme.secondaryText : theme.tertiaryText
            }}
          />
        ))}
      </View>
      <Button
        testID={isLastStep ? 'sync-import-start-scanning' : 'sync-import-next-step'}
        // `tertiary` is the filled grey button of the design. `secondary` is the same on
        // mobile, but on web it is white, which is invisible on the white panel.
        type={isLastStep ? 'primary' : 'tertiary'}
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

const MemoizedSyncImportStepsFooter = memo(SyncImportStepsFooter)

export { MemoizedSyncImportStepsFooter as SyncImportStepsFooter }

export default memo(SyncImportSteps)
