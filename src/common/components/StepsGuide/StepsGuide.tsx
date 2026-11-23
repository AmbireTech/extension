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

export interface StepsGuideStep {
  id: string
  /** The design's illustration (image or animation) of the step */
  illustration: ReactNode
  content: ReactNode
}

interface Props {
  steps: StepsGuideStep[]
  /**
   * The step is controlled by the parent, so its back button can return to the previous
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
  /** Label of the button on the last step, which finishes the guide */
  finishText: string
  finishIcon?: React.ReactNode
  onFinish: () => void
  nextButtonTestID?: string
  finishButtonTestID?: string
}

/**
 * A guide of a few steps, each an illustration on a card with its content below it. The
 * parent owns the current step and passes the steps (copy and illustrations) in, so the
 * same guide works in a screen, a sheet or a swipeable carousel.
 */
const StepsGuide = ({ steps, stepIndex, style, illustrationCardStyle }: Props) => {
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
 * themselves, so a mobile screen can pin it to the bottom of the screen as a footer.
 */
const StepsGuideFooter = ({
  steps,
  stepIndex,
  onStepIndexChange,
  finishText,
  finishIcon,
  onFinish,
  nextButtonTestID,
  finishButtonTestID,
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
        testID={isLastStep ? finishButtonTestID : nextButtonTestID}
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

const MemoizedStepsGuideFooter = memo(StepsGuideFooter)

export { MemoizedStepsGuideFooter as StepsGuideFooter }

export default memo(StepsGuide)
