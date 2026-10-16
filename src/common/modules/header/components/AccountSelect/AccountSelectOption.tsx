import React, { useCallback } from 'react'
import { Animated, View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import AccountAddress from '@common/components/AccountAddress'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

/** Height of a row, including the gap below its card (the last row has none) - the list relies on it being fixed */
export const ACCOUNT_SELECT_OPTION_HEIGHT = 76
const CARD_GAP = SPACING_TY
const HIDDEN_OPACITY = 0.45
// Fills the card up to the Hide / Show button, the card's padding included, so it's all pressable
const ACCOUNT_INFO_STYLE: ViewStyle = {
  ...flexbox.flex1,
  ...flexbox.directionRow,
  ...flexbox.alignCenter,
  ...spacings.plSm,
  alignSelf: 'stretch',
  minWidth: 0
}
const ACCOUNT_INFO_WITHOUT_TOGGLE_STYLE: ViewStyle = { ...ACCOUNT_INFO_STYLE, ...spacings.prSm }

type Props = {
  account: Account
  isSelected: boolean
  /** The badge of the selected account. Defaults to "Selected" */
  selectedBadgeText?: string
  isHidden?: boolean
  /** The last row has no gap below it */
  isLast?: boolean
  onPress: (addr: string) => void
  /** Omit to show no Hide / Show button, e.g. for the selected account */
  onToggleVisibility?: (addr: string) => void
}

const AccountSelectOption = ({
  account,
  isSelected,
  selectedBadgeText,
  isHidden,
  isLast,
  onPress,
  onToggleVisibility
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const reverseLookup = useReverseLookup({ address: account.addr, privacyUpdateMode: 'never' })

  const handlePress = useCallback(() => onPress(account.addr), [onPress, account.addr])
  const handleToggleVisibility = useCallback(
    () => onToggleVisibility?.(account.addr),
    [onToggleVisibility, account.addr]
  )

  // The same colors as the rows of the account select screen
  const [bindRowHover, rowHoverStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.secondaryBackground, to: theme.hoverBackground }
  })

  const smartAccountType = account.safeCreation ? 'Safe' : account.creation ? 'Ambire' : undefined
  const VisibilityToggleIcon = isHidden ? VisibilityIcon : InvisibilityIcon
  const accountInfoStyle = onToggleVisibility
    ? ACCOUNT_INFO_STYLE
    : ACCOUNT_INFO_WITHOUT_TOGGLE_STYLE
  // Animated while the account can be picked, so the card changes on hover
  const cardBackgroundColor = isSelected
    ? theme.primaryAccent100
    : isHidden
      ? theme.secondaryBackground
      : rowHoverStyle.backgroundColor

  const accountInfo = (
    <>
      <View style={isHidden && { opacity: HIDDEN_OPACITY }}>
        <Avatar
          address={account.addr}
          pfp={account.preferences.pfp}
          smartAccountType={smartAccountType}
          size={40}
          // The card the avatar sits on, so the ring of its badge blends into it
          typeBadgeRingColor={cardBackgroundColor}
        />
      </View>
      <View style={[flexbox.flex1, { minWidth: 0 }, isHidden && { opacity: HIDDEN_OPACITY }]}>
        <Text fontSize={15} weight="medium" numberOfLines={1}>
          {account.preferences.label}
        </Text>
        <AccountAddress {...reverseLookup} address={account.addr} fontSize={12} withCopy={false} />
      </View>
      {isSelected && (
        <Badge
          type="primaryAccent"
          text={selectedBadgeText ?? t('Selected')}
          // The card already has the accent background, so the badge stands out on the page one
          style={{ ...spacings.mlTy, backgroundColor: theme.primaryBackground }}
        />
      )}
    </>
  )

  return (
    <View
      style={
        isLast
          ? { height: ACCOUNT_SELECT_OPTION_HEIGHT - CARD_GAP }
          : { height: ACCOUNT_SELECT_OPTION_HEIGHT, paddingBottom: CARD_GAP }
      }
    >
      <Animated.View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          {
            height: ACCOUNT_SELECT_OPTION_HEIGHT - CARD_GAP,
            borderRadius: BORDER_RADIUS_PRIMARY,
            borderWidth: 1.5,
            borderColor: isSelected ? theme.primaryAccent200 : 'transparent',
            backgroundColor: cardBackgroundColor
          }
        ]}
      >
        {isHidden ? (
          // A hidden account must be shown first, as the selected account is always visible
          <View style={accountInfoStyle}>{accountInfo}</View>
        ) : (
          <AnimatedPressable
            {...bindRowHover}
            style={accountInfoStyle}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            testID={`account-select-option-${account.addr}`}
          >
            {accountInfo}
          </AnimatedPressable>
        )}
        {/* Next to the account's button rather than in it, as a button can't contain another */}
        {!!onToggleVisibility && (
          <View style={spacings.prSm}>
            <HoverablePressable
              onPress={handleToggleVisibility}
              accessibilityRole="button"
              testID={`account-select-${isHidden ? 'show' : 'hide'}-${account.addr}`}
            >
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  spacings.phSm,
                  spacings.mlTy,
                  {
                    height: 36,
                    columnGap: 6,
                    borderRadius: 8,
                    backgroundColor: theme.primaryBackground
                  }
                ]}
              >
                <VisibilityToggleIcon width={16} height={16} color={theme.iconPrimary} />
                <Text fontSize={13} weight="medium" appearance="secondaryText">
                  {isHidden ? t('Show') : t('Hide')}
                </Text>
              </View>
            </HoverablePressable>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

export default React.memo(AccountSelectOption)
