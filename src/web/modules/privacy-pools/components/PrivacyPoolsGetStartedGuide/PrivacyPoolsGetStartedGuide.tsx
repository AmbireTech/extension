import React, { FC, useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'

import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import StepsGuide, { StepsGuideFooter, StepsGuideStep } from '@common/components/StepsGuide'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import joinNames from '@common/utils/joinNames'
import { getUiType } from '@common/utils/uiType'

import type { SheetRef } from '@common/components/BottomSheet/useSheetRef'

import PrivacyPoolsGuideIllustration from './PrivacyPoolsGuideIllustration'
import {
  PrivacyPoolsGuideAccountChip,
  PrivacyPoolsGuideTransfer,
  PrivacyPoolsGuideVerifyingToken
} from './PrivacyPoolsGuideVisuals'
import styles from './styles'

const { isTab } = getUiType()

interface StepText {
  id: string
  title: string
  description: string
}

const StepTextContent = ({ title, description }: Omit<StepText, 'id'>) => (
  <View style={styles.stepText}>
    <Text fontSize={20} weight="medium" style={styles.title}>
      {title}
    </Text>
    <Text fontSize={16} appearance="secondaryText" style={styles.description}>
      {description}
    </Text>
  </View>
)

const MeasuredStepText = ({
  id,
  title,
  description,
  onMeasure
}: StepText & { onMeasure: (id: string, height: number) => void }) => {
  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => onMeasure(id, layout.height),
    [id, onMeasure]
  )

  return (
    <View style={styles.measuredText} onLayout={handleLayout}>
      <StepTextContent title={title} description={description} />
    </View>
  )
}

interface Props {
  sheetRef: React.RefObject<SheetRef | null>
  closeBottomSheet: () => void
  /** The tokens that can be sent to the account from a public one, e.g. ETH, USDC and USDT */
  depositableSymbols: string[]
}

/**
 * Explains how a Privacy Pools account works, step by step: what it is, how to top it up, the
 * verification of what is sent to it and sending privately from it. A bottom sheet in the
 * popup and the side panel, a modal in a tab.
 */
const PrivacyPoolsGetStartedGuide: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  depositableSymbols
}) => {
  const { t } = useTranslation()
  const [stepIndex, setStepIndex] = useState(0)
  // How tall each step's text is at the sheet's width
  const [textHeights, setTextHeights] = useState<{ [id: string]: number }>({})

  const topUpText = useMemo(() => {
    if (!depositableSymbols.length)
      return t(
        'To top up your private account, simply send funds from any of your regular accounts to your private account.'
      )

    return t(
      'To top up your private account, simply send {{tokens}} from any of your regular accounts to your private account.',
      { tokens: joinNames(depositableSymbols, t, 'or') }
    )
  }, [depositableSymbols, t])

  const stepsContent: (StepText & { illustration: React.ReactNode })[] = useMemo(
    () => [
      {
        id: 'private-account',
        title: t('Your private accounts'),
        description: t(
          'This is your private account. All funds that you send to your private account are shielded and untraceable.'
        ),
        illustration: <PrivacyPoolsGuideAccountChip type="private" fontSize={20} />
      },
      {
        id: 'top-up',
        title: t('Top up'),
        description: topUpText,
        illustration: <PrivacyPoolsGuideTransfer from="public" to="private" />
      },
      {
        id: 'verification',
        title: t('Private funds are verified'),
        description: t(
          'When you send funds to a private account, Privacy Pools checks where they came from. This usually takes up to 1 hour (rarely up to 7 days). You can get your funds back anytime.'
        ),
        illustration: <PrivacyPoolsGuideVerifyingToken />
      },
      {
        id: 'private-send',
        title: t('Private send'),
        description: t(
          'Once funds are verified, you can send them privately to any public address.'
        ),
        illustration: <PrivacyPoolsGuideTransfer from="private" to="public" />
      }
    ],
    [t, topUpText]
  )

  const handleTextMeasure = useCallback((id: string, height: number) => {
    setTextHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }))
  }, [])

  // Every step leaves as much room as its longest text takes, so the dots and the button stay in
  // place while the steps change. Measured, as how many lines a text takes depends on the width.
  const textMinHeight = Math.max(0, ...Object.values(textHeights))

  const steps: StepsGuideStep[] = useMemo(
    () =>
      stepsContent.map(({ id, title, description, illustration }, index) => ({
        id,
        illustration: (
          // The light moves from right to left as the guide goes on
          <PrivacyPoolsGuideIllustration progress={index / (stepsContent.length - 1)}>
            {illustration}
          </PrivacyPoolsGuideIllustration>
        ),
        content: (
          <View style={{ minHeight: textMinHeight }}>
            <StepTextContent title={title} description={description} />
          </View>
        )
      })),
    [stepsContent, textMinHeight]
  )

  const goToPreviousStep = useCallback(() => setStepIndex((prev) => Math.max(prev - 1, 0)), [])
  // Starts over the next time it opens
  const handleClosed = useCallback(() => setStepIndex(0), [])

  return (
    <BottomSheet
      id="privacy-pools-get-started-guide"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={handleClosed}
      type={isTab ? 'modal' : 'bottom-sheet'}
      style={styles.sheet}
    >
      {/* Every step's text at the width it is shown at, to measure the longest one. At the top,
      so it stays within the content and never makes the sheet scroll */}
      <View style={styles.measuredTexts} pointerEvents="none" aria-hidden>
        {stepsContent.map(({ id, title, description }) => (
          <MeasuredStepText
            key={id}
            id={id}
            title={title}
            description={description}
            onMeasure={handleTextMeasure}
          />
        ))}
      </View>
      {/* The ‹ steps back. Closing is the X, as in every sheet. Spaced less from the steps than
      in other sheets, so the guide fits the popup without scrolling */}
      <SheetHeaderRow onBack={stepIndex ? goToPreviousStep : undefined} style={spacings.mbTy}>
        <Text fontSize={20} weight="medium" style={text.center}>
          {t('Private transfers')}
        </Text>
      </SheetHeaderRow>
      <StepsGuide
        steps={steps}
        stepIndex={stepIndex}
        illustrationCardStyle={styles.illustrationCard}
      />
      <StepsGuideFooter
        steps={steps}
        stepIndex={stepIndex}
        onStepIndexChange={setStepIndex}
        finishText={t('Got it')}
        finishButtonType="tertiary"
        onFinish={closeBottomSheet}
        buttonStyle={styles.button}
        nextButtonTestID="privacy-pools-guide-next"
        finishButtonTestID="privacy-pools-guide-got-it"
        style={spacings.mtLg}
      />
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsGetStartedGuide)
