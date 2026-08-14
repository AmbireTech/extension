import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Account } from '@ambire-common/interfaces/account'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import AccountRow from '@common/modules/account-select/components/Account'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import text from '@common/styles/utils/text'

// The design shortens the address, so it fits on one line next to the copy button
const SHORTENED_ADDRESS_LENGTH = 20

/**
 * The whole sheet keeps this one distance from the edge of the screen: the sheet's own
 * padding is turned off and the header, the list and the footer apply it instead, so the
 * checkboxes line up with everything else.
 */
const SHEET_HORIZONTAL_PADDING = isWeb ? SPACING : SPACING_SM

interface Props {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  accounts: Account[]
  selectedAddrs: Account['addr'][]
  areAllSelected: boolean
  onToggleAccount: (addr: Account['addr']) => void
  onToggleAllAccounts: () => void
  onConfirm: () => void
  isConfirmDisabled?: boolean
}

/**
 * The list the user picks the accounts to send to the other Ambire product from. The
 * rows are the account rows of the accounts screen with a checkbox in front, and they go
 * through the sheet's own list, with the select all checkbox in its header and the
 * confirm button in its footer.
 */
const SelectAccountsToSyncSheet = ({
  sheetRef,
  closeBottomSheet,
  accounts,
  selectedAddrs,
  areAllSelected,
  onToggleAccount,
  onToggleAllAccounts,
  onConfirm,
  isConfirmDisabled
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { bottom } = useSafeAreaInsets()

  const renderItem = useCallback(
    ({ item }: { item: Account }) => (
      <AccountRow
        account={item}
        onSelect={onToggleAccount}
        switchAccountOnPress={false}
        withSettings={false}
        withBalance={false}
        maxAccountAddrLength={SHORTENED_ADDRESS_LENGTH}
        containerStyle={spacings.ph0}
        renderLeftChildren={() => (
          <Checkbox
            value={selectedAddrs.includes(item.addr)}
            onValueChange={() => onToggleAccount(item.addr)}
            style={spacings.mb0}
          />
        )}
      />
    ),
    [onToggleAccount, selectedAddrs]
  )

  const flatListProps = useMemo(
    () => ({
      data: accounts,
      renderItem,
      keyExtractor: (item: Account) => item.addr,
      contentContainerStyle: {
        paddingHorizontal: SHEET_HORIZONTAL_PADDING,
        paddingBottom: SPACING_SM
      },
      ListEmptyComponent: (
        <Text fontSize={14} appearance="secondaryText" style={[spacings.mvMd, text.center]}>
          {t('No accounts to export.')}
        </Text>
      )
    }),
    [accounts, renderItem, t]
  )

  return (
    <BottomSheet
      id="select-accounts-to-sync"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      style={spacings.ph0}
      HeaderComponent={
        <View
          style={[
            { paddingHorizontal: SHEET_HORIZONTAL_PADDING },
            { backgroundColor: theme.primaryBackground }
          ]}
        >
          <ModalHeader handleClose={closeBottomSheet} title={t('Select accounts to export')} />
          <Checkbox
            value={areAllSelected}
            onValueChange={onToggleAllAccounts}
            label={t('Select all')}
            labelProps={{ fontSize: 14, appearance: 'primaryText' }}
            style={spacings.mbSm}
          />
          {/* A background view instead of a border, as per-side borders can leak onto
          the next screen on native */}
          <View style={{ height: 1, backgroundColor: theme.primaryBorder }} />
        </View>
      }
      flatListProps={flatListProps}
      FooterComponent={
        <View
          style={[
            spacings.ptSm,
            {
              paddingHorizontal: SHEET_HORIZONTAL_PADDING,
              paddingBottom: bottom || SPACING_SM,
              backgroundColor: theme.primaryBackground
            }
          ]}
        >
          <Button
            testID="confirm-accounts-to-sync"
            text={t('Confirm')}
            disabled={isConfirmDisabled || !selectedAddrs.length}
            onPress={onConfirm}
            hasBottomSpacing={false}
          />
        </View>
      }
    />
  )
}

export default React.memo(SelectAccountsToSyncSheet)
