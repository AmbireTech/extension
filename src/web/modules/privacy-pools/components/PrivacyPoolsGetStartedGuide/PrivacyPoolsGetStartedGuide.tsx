import React, { FC, useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'

import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import StepsGuide, { StepsGuideFooter, StepsGuideStep } from '@common/components/StepsGuide'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_SECONDARY } from '@common/styles/utils/common'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'

import type { SheetRef } from '@common/components/BottomSheet/useSheetRef'

import PrivacyPoolsGuideIllustration from './PrivacyPoolsGuideIllustration'
import {
  PrivacyPoolsGuideAccountChip,
  PrivacyPoolsGuideTransfer,
  PrivacyPoolsGuideVerifyingToken
} from './PrivacyPoolsGuideVisuals'

const { isTab } = getUiType()

// As wide as in the design, also as a modal in a tab
const SHEET_STYLE = { maxWidth: 400 }
// The illustration draws its own card, so the step's card only spaces it from the text
const ILLUSTRATION_CARD_STYLE = {
  paddingVertical: 0,
  marginBottom: SPACING_SM,
  borderRadius: BORDER_RADIUS_SECONDARY,
  overflow: 'hidden' as const
}
// The design's line heights, which are tighter than the font's own, so the guide fits the popup
const TITLE_STYLE = { ...spacings.mbMi, lineHeight: 28 }
const DESCRIPTION_STYLE = { lineHeight: 20 }
// Out of the flow and invisible: only measured
const MEASURED_TEXTS_STYLE = { height: 0, opacity: 0 }
const MEASURED_TEXT_STYLE = { position: 'absolute' as const, top: 0, left: 0, right: 0 }
const BUTTON_STYLE = { width: 180, alignSelf: 'center' as const }

/**
 * Where the light ray falls on each step, in the design's pixels. Moved by every step, as
 * the light on a turning card.
 */
const RAY_OFFSETS = {
  privateAccount: 0,
  topUp: -38,
  verification: -98,
  privateSend: -68
}

interface StepText {
  id: string
  title: string
  description: string
}

const StepTextContent = ({ title, description }: Omit<StepText, 'id'>) => (
  <View style={spacings.phSm}>
    <Text fontSize={20} weight="medium" style={TITLE_STYLE}>
      {title}
    </Text>
    <Text fontSize={16} appearance="secondaryText" style={DESCRIPTION_STYLE}>
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
    <View style={MEASURED_TEXT_STYLE} onLayout={handleLayout}>
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

    const tokens =
      depositableSymbols.length === 1
        ? depositableSymbols[0]
        : t('{{tokens}} or {{lastToken}}', {
            tokens: depositableSymbols.slice(0, -1).join(', '),
            lastToken: depositableSymbols[depositableSymbols.length - 1]
          })

    return t(
      'To top up your private account, simply send {{tokens}} from any of your regular accounts to your private account.',
      { tokens }
    )
  }, [depositableSymbols, t])

  const stepTexts: StepText[] = useMemo(
    () => [
      {
        id: 'private-account',
        title: t('Your private accounts'),
        description: t(
          'This is your private account. All funds that you send to your private account are shielded and untraceable.'
        )
      },
      { id: 'top-up', title: t('Top up'), description: topUpText },
      {
        id: 'verification',
        title: t('Private funds are verified'),
        description: t(
          'When you send funds to a private account, Privacy Pools checks where they came from. This usually takes up to 1 hour (rarely up to 7 days). You can get your funds back anytime.'
        )
      },
      {
        id: 'private-send',
        title: t('Private send'),
        description: t(
          'Once funds are verified, you can send them privately to any public address.'
        )
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

  const steps: StepsGuideStep[] = useMemo(() => {
    const illustrations: { [id: string]: React.ReactNode } = {
      'private-account': (
        <PrivacyPoolsGuideIllustration rayOffset={RAY_OFFSETS.privateAccount}>
          <PrivacyPoolsGuideAccountChip type="private" fontSize={20} />
        </PrivacyPoolsGuideIllustration>
      ),
      'top-up': (
        <PrivacyPoolsGuideIllustration rayOffset={RAY_OFFSETS.topUp}>
          <PrivacyPoolsGuideTransfer from="public" to="private" />
        </PrivacyPoolsGuideIllustration>
      ),
      verification: (
        <PrivacyPoolsGuideIllustration rayOffset={RAY_OFFSETS.verification}>
          <PrivacyPoolsGuideVerifyingToken />
        </PrivacyPoolsGuideIllustration>
      ),
      'private-send': (
        <PrivacyPoolsGuideIllustration rayOffset={RAY_OFFSETS.privateSend}>
          <PrivacyPoolsGuideTransfer from="private" to="public" />
        </PrivacyPoolsGuideIllustration>
      )
    }

    return stepTexts.map(({ id, title, description }) => ({
      id,
      illustration: illustrations[id],
      content: (
        <View style={{ minHeight: textMinHeight }}>
          <StepTextContent title={title} description={description} />
        </View>
      )
    }))
  }, [stepTexts, textMinHeight])

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
      style={SHEET_STYLE}
    >
      {/* Every step's text at the width it is shown at, to measure the longest one. At the top,
      so it stays within the content and never makes the sheet scroll */}
      <View style={MEASURED_TEXTS_STYLE} pointerEvents="none" aria-hidden>
        {stepTexts.map(({ id, title, description }) => (
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
        illustrationCardStyle={ILLUSTRATION_CARD_STYLE}
      />
      <StepsGuideFooter
        steps={steps}
        stepIndex={stepIndex}
        onStepIndexChange={setStepIndex}
        finishText={t('Got it')}
        finishButtonType="tertiary"
        onFinish={closeBottomSheet}
        buttonStyle={BUTTON_STYLE}
        nextButtonTestID="privacy-pools-guide-next"
        finishButtonTestID="privacy-pools-guide-got-it"
        style={spacings.mtLg}
      />
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsGetStartedGuide)
