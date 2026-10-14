import React from 'react'
import { LayoutChangeEvent, View } from 'react-native'

import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const ROW_HEIGHT = 32
/** Height of the visible section's header - the list relies on it being fixed */
export const ACCOUNT_SELECT_VISIBLE_HEADER_HEIGHT = ROW_HEIGHT + SPACING_TY
// The card above the hidden section's line already leaves a gap below it
const SEPARATOR_TOP_PADDING = SPACING_SM - SPACING_TY
/** Height of the hidden section's header, which has a line above it with spacing on both sides */
export const ACCOUNT_SELECT_HIDDEN_HEADER_HEIGHT =
  SEPARATOR_TOP_PADDING + 1 + SPACING_SM + ROW_HEIGHT + SPACING_TY
/** Height of the visible section's header when its action is on a row of its own */
export const ACCOUNT_SELECT_VISIBLE_HEADER_WITH_ACTION_ROW_HEIGHT = 2 * (ROW_HEIGHT + SPACING_TY)
/** Below this header width the section's action doesn't fit next to the title and the count */
export const ACCOUNT_SELECT_MIN_WIDTH_FOR_INLINE_ACTION = 500

type ActionProps = {
  type: 'visible' | 'hidden'
  text: string
  onPress: () => void
}

const SectionAction = React.memo(function SectionAction({ type, text, onPress }: ActionProps) {
  const { theme } = useTheme()

  return (
    <HoverablePressable
      onPress={onPress}
      accessibilityRole="button"
      testID={`account-select-${type}-section-action`}
    >
      <View
        style={[
          flexbox.center,
          spacings.phSm,
          {
            height: ROW_HEIGHT,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.tertiaryBackground,
            backgroundColor: theme.primaryBackground
          }
        ]}
      >
        <Text fontSize={13} weight="medium" appearance="primary">
          {text}
        </Text>
      </View>
    </HoverablePressable>
  )
})

type Props = {
  type: 'visible' | 'hidden'
  count: number
  /** The app can see every account, so the count is replaced by "All accounts" */
  isAll?: boolean
  actionText?: string
  onAction?: () => void
  /** Puts the action below the title, for when they don't fit on one row */
  isActionOnOwnRow?: boolean
  onLayout?: (e: LayoutChangeEvent) => void
}

const AccountSelectSectionHeader = ({
  type,
  count,
  isAll,
  actionText,
  onAction,
  isActionOnOwnRow,
  onLayout
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const isVisibleSection = type === 'visible'
  const SectionIcon = isVisibleSection ? VisibilityIcon : InvisibilityIcon
  const accentColor = isVisibleSection ? theme.successText : theme.secondaryText
  const accentBackground = isVisibleSection ? theme.successBackground : theme.tertiaryBackground
  const hasAction = !!actionText && !!onAction
  const visibleHeaderHeight =
    hasAction && isActionOnOwnRow
      ? ACCOUNT_SELECT_VISIBLE_HEADER_WITH_ACTION_ROW_HEIGHT
      : ACCOUNT_SELECT_VISIBLE_HEADER_HEIGHT

  return (
    <View
      onLayout={onLayout}
      style={{
        height: isVisibleSection ? visibleHeaderHeight : ACCOUNT_SELECT_HIDDEN_HEADER_HEIGHT,
        paddingTop: isVisibleSection ? 0 : SEPARATOR_TOP_PADDING,
        backgroundColor: theme.primaryBackground
      }}
    >
      {/* A background line, as a top border can leak onto the next screen on native */}
      {!isVisibleSection && (
        <View style={{ height: 1, backgroundColor: theme.tertiaryBackground }} />
      )}
      {/* The first section's header sits right under the search, so it starts at the top */}
      <View
        style={[
          { height: ROW_HEIGHT },
          !isVisibleSection && spacings.mtSm,
          flexbox.directionRow,
          flexbox.alignCenter,
          { columnGap: 8 }
        ]}
      >
        <View
          style={[
            flexbox.center,
            { width: 24, height: 24, borderRadius: 6, backgroundColor: accentBackground }
          ]}
        >
          <SectionIcon width={16} height={16} color={accentColor} />
        </View>
        <Text fontSize={13} weight="medium" appearance="secondaryText" numberOfLines={1}>
          {isVisibleSection ? t('Visible to the app') : t('Hidden from the app')}
        </Text>
        <View
          style={[
            flexbox.center,
            spacings.phMi,
            { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: accentBackground }
          ]}
        >
          <Text fontSize={12} weight="semiBold" color={accentColor}>
            {isAll ? t('All accounts') : count}
          </Text>
        </View>
        {hasAction && !isActionOnOwnRow && (
          <View style={{ marginLeft: 'auto' }}>
            <SectionAction type={type} text={actionText} onPress={onAction} />
          </View>
        )}
      </View>
      {hasAction && isActionOnOwnRow && (
        <View style={spacings.mtTy}>
          <SectionAction type={type} text={actionText} onPress={onAction} />
        </View>
      )}
    </View>
  )
}

export default React.memo(AccountSelectSectionHeader)
