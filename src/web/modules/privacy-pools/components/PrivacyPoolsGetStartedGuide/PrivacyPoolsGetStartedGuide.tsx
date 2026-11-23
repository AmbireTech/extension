import React, { FC, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

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
/**
 * As tall as the step with the longest text, so the dots and the button stay in place
 * while the steps change
 */
const STEPS_STYLE = { minHeight: 366 }
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

  const steps: StepsGuideStep[] = useMemo(() => {
    const renderContent = (title: string, description: string) => (
      <View style={spacings.phSm}>
        <Text fontSize={20} weight="medium" style={spacings.mbMi}>
          {title}
        </Text>
        <Text fontSize={16} appearance="secondaryText">
          {description}
        </Text>
      </View>
    )

    return [
      {
        id: 'private-account',
        illustration: (
          <PrivacyPoolsGuideIllustration rayOffset={RAY_OFFSETS.privateAccount}>
            <PrivacyPoolsGuideAccountChip type="private" fontSize={20} />
          </PrivacyPoolsGuideIllustration>
        ),
        content: renderContent(
          t('Your private accounts'),
          t(
            'This is your private account. All funds that you send to your private account are shielded and untraceable.'
          )
        )
      },
      {
        id: 'top-up',
        illustration: (
          <PrivacyPoolsGuideIllustration rayOffset={RAY_OFFSETS.topUp}>
            <PrivacyPoolsGuideTransfer from="public" to="private" />
          </PrivacyPoolsGuideIllustration>
        ),
        content: renderContent(t('Top up'), topUpText)
      },
      {
        id: 'verification',
        illustration: (
          <PrivacyPoolsGuideIllustration rayOffset={RAY_OFFSETS.verification}>
            <PrivacyPoolsGuideVerifyingToken />
          </PrivacyPoolsGuideIllustration>
        ),
        content: renderContent(
          t('Private funds are verified'),
          t(
            'When you send funds to a private account, Privacy Pools checks where they came from. This usually takes up to 1 hour (rarely up to 7 days). You can get your funds back anytime.'
          )
        )
      },
      {
        id: 'private-send',
        illustration: (
          <PrivacyPoolsGuideIllustration rayOffset={RAY_OFFSETS.privateSend}>
            <PrivacyPoolsGuideTransfer from="private" to="public" />
          </PrivacyPoolsGuideIllustration>
        ),
        content: renderContent(
          t('Private send'),
          t('Once funds are verified, you can send them privately to any public address.')
        )
      }
    ]
  }, [t, topUpText])

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
      {/* The ‹ steps back. Closing is the X, as in every sheet */}
      <SheetHeaderRow onBack={stepIndex ? goToPreviousStep : undefined}>
        <Text fontSize={20} weight="medium" style={text.center}>
          {t('Private transfers')}
        </Text>
      </SheetHeaderRow>
      <StepsGuide
        steps={steps}
        stepIndex={stepIndex}
        style={STEPS_STYLE}
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
