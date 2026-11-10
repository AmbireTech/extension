import React, { FC, useCallback } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsLeakAction, PrivacyPoolsLeakId } from '@ambire-common/interfaces/privacyPools'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import { COVER_WINDOW_DAYS, getPrivacyActionText, getPrivacyCoverText } from './helpers'
import { PrivacyStatusProps } from './types'

type Props = Omit<PrivacyStatusProps, 'style'> & {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
}

type ItemType = 'error' | 'warning' | 'info'

const ICON_SIZE = 18

/** Leaks that already say how few deposits hide the amount, so the cover line would repeat them. */
const COVER_LEAK_IDS: PrivacyPoolsLeakId[] = ['unusual-deposit-amount', 'unique-amount']

const RATING_SUMMARIES = {
  basic:
    'Nothing in this transfer links it to you. How well it hides depends on how many deposits are like yours.',
  weak: 'Some details make this transfer easier to link to you.',
  traceable: 'Anyone can link this transfer to you.',
  unchecked:
    'We could not check yet how private this transfer is, as the pool is still loading. Anything in it could link it to you.'
} as const

const COVER_EXPLANATIONS = {
  deposit:
    'Counts deposits from the last {{days}} days. More deposits of this amount make yours harder to find.',
  send: 'Counts deposits from the last {{days}} days. More deposits that can pay this transfer make yours harder to find.'
} as const

type ItemProps = {
  type: ItemType
  title: string
  text?: string
}

/** One privacy fact with its icon and a short explanation. */
const PrivacyItem: FC<ItemProps> = ({ type, title, text }) => {
  const { theme } = useTheme()
  const iconColor = {
    error: theme.errorDecorative,
    warning: theme.warningDecorative,
    info: theme.iconSecondary
  }[type]
  const Icon = type === 'info' ? InfoIcon : WarningIcon

  return (
    <View style={[flexbox.directionRow, flexbox.alignStart, spacings.mbMd]}>
      <Icon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} style={spacings.mrSm} />
      <View style={flexbox.flex1}>
        <Text fontSize={14} weight="semiBold">
          {title}
        </Text>
        {!!text && (
          <Text fontSize={12} appearance="secondaryText" style={spacings.mtMi}>
            {text}
          </Text>
        )}
      </View>
    </View>
  )
}

const MemoizedPrivacyItem = React.memo(PrivacyItem)

/** Every privacy suggestion of a Privacy Pools transfer with its fix, and how many deposits hide it. */
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
  const isCoverInLeaks = leaks.some(({ id }) => COVER_LEAK_IDS.includes(id))

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
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbLg}>
        {t(RATING_SUMMARIES[rating])}
      </Text>

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

      {/* Nothing was counted before the pool is read */}
      {!isCoverInLeaks && rating !== 'unchecked' && (
        <MemoizedPrivacyItem
          type="info"
          title={getPrivacyCoverText(t, cover)}
          text={t(COVER_EXPLANATIONS[stage], { days: COVER_WINDOW_DAYS })}
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(PrivacyModal)
