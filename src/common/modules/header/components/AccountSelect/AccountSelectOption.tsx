import React, { useCallback } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import AccountAddress from '@common/components/AccountAddress'
import Avatar from '@common/components/Avatar'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

/** Height of a row, including the gap below its card (the last row has none) - the list relies on it being fixed */
export const ACCOUNT_SELECT_OPTION_HEIGHT = 76
const CARD_GAP = SPACING_TY
const HIDDEN_OPACITY = 0.45

type Props = {
  account: Account
  isSelected: boolean
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

  const smartAccountType = account.safeCreation ? 'Safe' : account.creation ? 'Ambire' : undefined
  const VisibilityToggleIcon = isHidden ? VisibilityIcon : InvisibilityIcon

  return (
    <View
      style={
        isLast
          ? { height: ACCOUNT_SELECT_OPTION_HEIGHT - CARD_GAP }
          : { height: ACCOUNT_SELECT_OPTION_HEIGHT, paddingBottom: CARD_GAP }
      }
    >
      <HoverablePressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        testID={`account-select-option-${account.addr}`}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.phSm,
            {
              height: ACCOUNT_SELECT_OPTION_HEIGHT - CARD_GAP,
              borderRadius: BORDER_RADIUS_PRIMARY,
              borderWidth: 1.5,
              borderColor: isSelected ? theme.primaryAccent200 : 'transparent',
              backgroundColor: isSelected ? theme.primaryAccent100 : theme.secondaryBackground
            }
          ]}
        >
          <View style={isHidden && { opacity: HIDDEN_OPACITY }}>
            <Avatar
              address={account.addr}
              pfp={account.preferences.pfp}
              smartAccountType={smartAccountType}
              size={40}
            />
          </View>
          <View style={[flexbox.flex1, { minWidth: 0 }, isHidden && { opacity: HIDDEN_OPACITY }]}>
            <Text fontSize={15} weight="medium" numberOfLines={1}>
              {account.preferences.label}
            </Text>
            <AccountAddress
              {...reverseLookup}
              address={account.addr}
              fontSize={12}
              withCopy={false}
            />
          </View>
          {!!onToggleVisibility && (
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
                    height: 32,
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
          )}
        </View>
      </HoverablePressable>
    </View>
  )
}

export default React.memo(AccountSelectOption)
