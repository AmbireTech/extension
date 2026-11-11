import React, { FC, useCallback } from 'react'

import { PrivacyPoolsLeakAction, PrivacyPoolsRating } from '@ambire-common/interfaces/privacyPools'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import { getPrivacyActionText, getPrivacySeverity } from './helpers'
import PrivacyCommunityNote from './PrivacyCommunityNote'
import PrivacyCoverCard from './PrivacyCoverCard'
import { PrivacyStatusProps } from './types'

type Props = Omit<PrivacyStatusProps, 'style'> & {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
}

/** No summary for a basic rating, as any line there reads as a promise that the transfer is private. */
const RATING_SUMMARIES: Partial<Record<PrivacyPoolsRating, string>> = {
  weak: 'Some details make this transfer easier to link to you.',
  traceable: 'This transfer can be linked to you.',
  unchecked:
    "We could not check this transfer's privacy yet, as the pool is still loading. We cannot warn you about anything that links it to you."
}

/**
 * How many deposits hide a Privacy Pools transfer, then every privacy suggestion with its fix, and
 * that privacy grows with the pool.
 */
const PrivacyModal: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  stage,
  rating,
  leaks,
  cover,
  decimals,
  symbol,
  onSetAmount
}) => {
  const { t } = useTranslation()
  const { isPopup } = getUiType()
  const ratingSummary = RATING_SUMMARIES[rating]

  const runAction = useCallback(
    ({ meta }: PrivacyPoolsLeakAction) => {
      if (!onSetAmount) return

      closeBottomSheet()
      onSetAmount(meta.amount)
    },
    [closeBottomSheet, onSetAmount]
  )

  const getActionText = (action: PrivacyPoolsLeakAction | undefined) =>
    action && onSetAmount ? getPrivacyActionText(t, action, decimals, symbol) : undefined
  // Nothing was counted before the pool is read
  const isCoverShown = rating !== 'unchecked'
  const hasContentBelowCover = !!ratingSummary || leaks.length > 0

  return (
    <BottomSheet
      id={`privacy-pools-privacy-${stage}`}
      type={isPopup || isMobile ? 'bottom-sheet' : 'modal'}
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      style={isWeb ? { maxWidth: 600 } : undefined}
      backgroundColor="primaryBackground"
    >
      <ModalHeader
        title={stage === 'deposit' ? t('Privacy of this deposit') : t('Privacy of this transfer')}
        handleClose={closeBottomSheet}
      />
      {isCoverShown && (
        <PrivacyCoverCard
          stage={stage}
          cover={cover}
          severity={getPrivacySeverity(stage, rating, cover)}
          style={hasContentBelowCover ? spacings.mbLg : undefined}
        />
      )}
      {!!ratingSummary && (
        <Text fontSize={14} appearance="secondaryText" style={spacings.mbLg}>
          {t(ratingSummary)}
        </Text>
      )}

      {leaks.map((leak) => {
        const [action] = leak.actions
        const actionText = getActionText(action)

        return (
          <Alert
            key={leak.id}
            type={leak.type}
            size="sm"
            title={t(leak.title)}
            text={leak.text ? t(leak.text) : undefined}
            style={spacings.mbMd}
          >
            {/* Primary, not the alert's own color, as it fixes the problem */}
            {!!action && !!actionText && (
              <Button
                testID={`privacy-pools-${stage}-${leak.id}-action`}
                type="primary"
                // Enter belongs to the send form behind the sheet
                submitOnEnter={false}
                size="small"
                text={actionText}
                onPress={() => runAction(action)}
                hasBottomSpacing={false}
                style={[flexbox.alignSelfEnd, spacings.mtSm]}
              />
            )}
          </Alert>
        )
      })}

      {/* The cover card has it already */}
      {!isCoverShown && <PrivacyCommunityNote style={spacings.mtTy} />}
    </BottomSheet>
  )
}

export default React.memo(PrivacyModal)
