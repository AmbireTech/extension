import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { Account } from '@ambire-common/interfaces/account'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import AccountRow from '@common/modules/account-select/components/Account'
import SyncOptionRow from '@common/modules/app-data-sync/components/SyncOptionRow'
import type { SyncOption } from '@common/modules/app-data-sync/hooks/useAppDataSyncExport/useAppDataSyncExport'
import spacings, { SPACING, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import text from '@common/styles/utils/text'

// The design shortens the address, so it fits on one line next to the copy button
const SHORTENED_ADDRESS_LENGTH = 20

// The design keeps this sheet narrower than the default width of the web modals
const SHEET_STYLE = { ...spacings.ph0, ...(isWeb ? { maxWidth: 400 } : {}) }

/**
 * The whole sheet keeps this one distance from the edge of the screen: the sheet's own
 * padding is turned off and the header, the list and the footer apply it instead, so the
 * checkboxes line up with everything else.
 */
const SHEET_HORIZONTAL_PADDING = isWeb ? SPACING : SPACING_SM

/**
 * The rows keep the small horizontal padding of their own, so their hover background does not
 * start right at the checkbox. The list gives up as much of its padding, which keeps the
 * checkboxes of the rows in line with the select all checkbox of the header.
 */
const LIST_HORIZONTAL_PADDING = SHEET_HORIZONTAL_PADDING - SPACING_TY

interface Props {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  accounts: Account[]
  selectedAddrs: Account['addr'][]
  areAllSelected: boolean
  hasSelection: boolean
  /** How many stored recovery phrases the selected accounts were derived from */
  selectedSeedsCount: number
  includeSeeds: boolean
  onToggleIncludeSeeds: () => void
  syncOptions: Record<SyncOption, boolean>
  onToggleSyncOption: (option: SyncOption) => void
  onToggleAccount: (addr: Account['addr']) => void
  /** Selects (or clears) every account together with the settings, networks and Address Book */
  onToggleAll: () => void
  onConfirm: () => void
  isConfirmDisabled?: boolean
}

/**
 * The list the user picks what to send to the other Ambire product from. The account
 * rows are the ones of the accounts screen with a checkbox in front, and they go
 * through the sheet's own list, after the rows of the settings, networks and Address Book.
 * The select all checkbox is in the sheet's header and the confirm button in its footer.
 */
const SelectDataToSyncSheet = ({
  sheetRef,
  closeBottomSheet,
  accounts,
  selectedAddrs,
  areAllSelected,
  hasSelection,
  selectedSeedsCount,
  includeSeeds,
  onToggleIncludeSeeds,
  syncOptions,
  onToggleSyncOption,
  onToggleAccount,
  onToggleAll,
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
        maxAccountAddrLength={SHORTENED_ADDRESS_LENGTH}
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

  const syncOptionRows = useMemo(
    () => (
      <>
        <SyncOptionRow
          option="settings"
          title={t('Settings')}
          subtitle={t('Theme, account icons and privacy opt-outs')}
          isSelected={syncOptions.settings}
          onToggle={onToggleSyncOption}
        />
        <SyncOptionRow
          option="networks"
          title={t('Networks')}
          subtitle={t('All networks, including the ones you added and their connection settings')}
          isSelected={syncOptions.networks}
          onToggle={onToggleSyncOption}
        />
        <SyncOptionRow
          option="addressBook"
          title={t('Address book')}
          subtitle={t('The contacts you saved, with their names and addresses')}
          isSelected={syncOptions.addressBook}
          onToggle={onToggleSyncOption}
        />
      </>
    ),
    [onToggleSyncOption, syncOptions, t]
  )

  const includeSeedsLabel = useMemo(() => {
    const s = selectedSeedsCount > 1 ? 's' : ''

    return selectedAddrs.length > 1
      ? t('Also export the stored recovery phrase{{s}} these accounts come from', { s })
      : t('Also export the stored recovery phrase{{s}} this account comes from', { s })
  }, [selectedAddrs.length, selectedSeedsCount, t])

  const flatListProps = useMemo(
    () => ({
      data: accounts,
      renderItem,
      keyExtractor: (item: Account) => item.addr,
      ListHeaderComponent: syncOptionRows,
      contentContainerStyle: {
        paddingHorizontal: LIST_HORIZONTAL_PADDING,
        paddingBottom: SPACING_SM
      },
      ListEmptyComponent: (
        <Text fontSize={14} appearance="secondaryText" style={[spacings.mvMd, text.center]}>
          {t('No accounts to export.')}
        </Text>
      )
    }),
    [accounts, renderItem, syncOptionRows, t]
  )

  return (
    <BottomSheet
      id="select-data-to-sync"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      style={SHEET_STYLE}
      HeaderComponent={
        <View
          style={[
            { paddingHorizontal: SHEET_HORIZONTAL_PADDING },
            { backgroundColor: theme.primaryBackground }
          ]}
        >
          <ModalHeader handleClose={closeBottomSheet} title={t('Select to export')} />
          <Checkbox
            value={areAllSelected}
            onValueChange={onToggleAll}
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
              paddingBottom: isWeb ? 0 : bottom || SPACING_SM,
              backgroundColor: theme.primaryBackground
            }
          ]}
        >
          {/* Only worth asking when the selection actually brings a stored phrase along */}
          {!!selectedSeedsCount && (
            <Checkbox
              testID="include-seeds-in-sync"
              value={includeSeeds}
              onValueChange={onToggleIncludeSeeds}
              label={includeSeedsLabel}
              labelProps={{ fontSize: 14, appearance: 'secondaryText' }}
              style={spacings.mbMd}
            />
          )}
          <Button
            testID="confirm-data-to-sync"
            text={t('Confirm')}
            // An account or any of the settings, networks and Address Book is enough
            disabled={isConfirmDisabled || !hasSelection}
            onPress={onConfirm}
            hasBottomSpacing={false}
          />
        </View>
      }
    />
  )
}

export default React.memo(SelectDataToSyncSheet)
