import React, { useCallback, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'

import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** Height of a section header - the list relies on it being fixed */
export const ACCOUNT_SELECT_SECTION_HEADER_HEIGHT = 52
// Below this width "All accounts" doesn't fit next to the title and the button
const MIN_WIDTH_FOR_LONG_ALL_LABEL = 450

type Props = {
  type: 'visible' | 'hidden'
  count: number
  /** The app can see every account, so the count is replaced by "All" */
  isAll?: boolean
  actionText?: string
  onAction?: () => void
}

const AccountSelectSectionHeader = ({ type, count, isAll, actionText, onAction }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [width, setWidth] = useState(0)
  const isVisibleSection = type === 'visible'
  const SectionIcon = isVisibleSection ? VisibilityIcon : InvisibilityIcon
  const accentColor = isVisibleSection ? theme.successText : theme.secondaryText
  const accentBackground = isVisibleSection ? theme.successBackground : theme.tertiaryBackground

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width)
  }, [])

  const allLabel = width >= MIN_WIDTH_FOR_LONG_ALL_LABEL ? t('All accounts') : t('All')

  return (
    <View
      onLayout={handleLayout}
      style={{
        height: ACCOUNT_SELECT_SECTION_HEADER_HEIGHT,
        backgroundColor: theme.primaryBackground
      }}
    >
      {/* A background line, as a top border can leak onto the next screen on native */}
      {!isVisibleSection && (
        <View style={{ height: 1, backgroundColor: theme.tertiaryBackground }} />
      )}
      <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, { columnGap: 8 }]}>
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
            {isAll ? allLabel : count}
          </Text>
        </View>
        {!!actionText && !!onAction && (
          <View style={{ marginLeft: 'auto' }}>
            <HoverablePressable
              onPress={onAction}
              accessibilityRole="button"
              testID={`account-select-${type}-section-action`}
            >
              <View
                style={[
                  flexbox.center,
                  spacings.phSm,
                  {
                    height: 32,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: theme.tertiaryBackground,
                    backgroundColor: theme.primaryBackground
                  }
                ]}
              >
                <Text fontSize={13} weight="medium" appearance="primary">
                  {actionText}
                </Text>
              </View>
            </HoverablePressable>
          </View>
        )}
      </View>
    </View>
  )
}

export default React.memo(AccountSelectSectionHeader)
