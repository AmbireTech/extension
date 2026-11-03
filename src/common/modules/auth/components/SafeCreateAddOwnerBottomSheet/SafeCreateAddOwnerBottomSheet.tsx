import { getAddress, isAddress } from 'ethers'
import React, { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Hex } from '@ambire-common/interfaces/hex'
import { Validation } from '@ambire-common/services/validations'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import AddressInput from '@common/components/AddressInput'
import BottomSheet from '@common/components/BottomSheet'
import BottomSheetTitle from '@common/components/BottomSheetTitle'
import Button from '@common/components/Button'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import SafeCreateOwnerRow from '@common/modules/auth/components/SafeCreateOwnerRow'
import SafeCreateSectionLabel from '@common/modules/auth/components/SafeCreateSectionLabel'
import useSafeOwnerDetails, { SafeOwnerDetails } from '@common/modules/auth/hooks/useSafeOwnerDetails'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Props = {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  /** The owners already added, left out of the lists and refused when entered */
  ownerAddresses: Hex[]
  onAdd: (address: Hex) => void
}

const EMPTY_ADDRESS_STATE: AddressState = {
  fieldValue: '',
  resolvedAddress: '',
  resolvedAddressType: null,
  isDomainResolving: false
}

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectContacts = (state: AllControllersMappingType['AddressBookController']) => state.contacts

const SEARCH_WIDTH = 180
const SEARCH_HEIGHT = 36

const OwnersCard = React.memo(
  ({
    owners,
    onPick,
    testIDPrefix
  }: {
    owners: SafeOwnerDetails[]
    onPick: (address: Hex) => void
    testIDPrefix: string
  }) => {
    const { theme } = useTheme()

    return (
      <View
        style={[
          common.borderRadiusPrimary,
          spacings.phSm,
          { backgroundColor: theme.tertiaryBackground }
        ]}
      >
        {owners.map((owner, index) => (
          <SafeCreateOwnerRow
            key={owner.address}
            owner={owner}
            onPress={onPick}
            withDivider={index < owners.length - 1}
            testID={`${testIDPrefix}-${owner.address}`}
          />
        ))}
      </View>
    )
  }
)

OwnersCard.displayName = 'OwnersCard'

/**
 * Adds an owner to the Safe about to be created: an entered address or domain, or one of
 * the wallet's accounts or address book contacts. A modal on web, a bottom sheet on mobile.
 */
const SafeCreateAddOwnerBottomSheet = ({
  sheetRef,
  closeBottomSheet,
  ownerAddresses,
  onAdd
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: contacts } = useController('AddressBookController', selectContacts)
  const getOwnerDetails = useSafeOwnerDetails()
  const [addressState, setAddressStateValues] = useState<AddressState>(EMPTY_ADDRESS_STATE)
  const {
    control: searchControl,
    watch: watchSearch,
    reset: resetSearch
  } = useForm<{ search: string }>({ defaultValues: { search: '' } })

  const setAddressState = useCallback((newState: AddressStateOptional) => {
    setAddressStateValues((current) => ({ ...current, ...newState }))
  }, [])
  const handleChangeText = useCallback(
    (fieldValue: string) => setAddressState({ fieldValue }),
    [setAddressState]
  )

  const ownerAddressSet = useMemo(
    () => new Set(ownerAddresses.map((address) => address.toLowerCase())),
    [ownerAddresses]
  )
  const enteredAddress = getAddressFromAddressState(addressState)
  const isEnteredAddressValid = isAddress(enteredAddress)
  const isEnteredAddressAnOwner =
    isEnteredAddressValid && ownerAddressSet.has(enteredAddress.toLowerCase())

  const overwriteValidation = useMemo<Validation | null>(
    () =>
      isEnteredAddressAnOwner
        ? { severity: 'error', message: t('You already added this owner.') }
        : null,
    [isEnteredAddressAnOwner, t]
  )
  const { validation } = useAddressInput({ addressState, setAddressState, overwriteValidation })
  const canAddEnteredAddress =
    isEnteredAddressValid && !addressState.isDomainResolving && validation.severity !== 'error'

  const pickableAccounts = useMemo(
    () => accounts.filter(({ addr }) => !ownerAddressSet.has(addr.toLowerCase())),
    [accounts, ownerAddressSet]
  )
  // The wallet's own accounts are contacts too, but they are already in the accounts list
  const pickableContacts = useMemo(
    () =>
      contacts.filter(
        ({ address, isWalletAccount }) =>
          !isWalletAccount && !ownerAddressSet.has(address.toLowerCase())
      ),
    [contacts, ownerAddressSet]
  )

  // Only the lists' own search narrows them, by name or address. The address field doesn't
  const search = watchSearch('search').trim().toLowerCase()
  const sections = useMemo(() => {
    const matchesSearch = (address: string, name: string) =>
      !search || address.toLowerCase().includes(search) || name.toLowerCase().includes(search)

    return [
      {
        key: 'account',
        title: t('Your accounts'),
        hasPickableOwners: !!pickableAccounts.length,
        owners: pickableAccounts
          .filter((account) => matchesSearch(account.addr, account.preferences.label))
          .map((account) => getOwnerDetails(account.addr as Hex))
      },
      {
        key: 'contact',
        title: t('Address book'),
        hasPickableOwners: !!pickableContacts.length,
        owners: pickableContacts
          .filter((contact) => matchesSearch(contact.address, contact.name))
          .map((contact) => getOwnerDetails(contact.address as Hex))
      }
    ].filter(({ hasPickableOwners }) => hasPickableOwners)
  }, [search, pickableAccounts, pickableContacts, getOwnerDetails, t])

  const handlePick = useCallback(
    (address: string) => {
      onAdd(getAddress(address) as Hex)
      closeBottomSheet()
    },
    [onAdd, closeBottomSheet]
  )
  const handleAddEnteredAddress = useCallback(() => {
    if (!canAddEnteredAddress) return

    handlePick(enteredAddress)
  }, [canAddEnteredAddress, enteredAddress, handlePick])

  // The next time the sheet opens it starts empty
  const handleClosed = useCallback(() => {
    setAddressStateValues(EMPTY_ADDRESS_STATE)
    resetSearch()
  }, [resetSearch])

  return (
    <BottomSheet
      id="safe-create-add-owner"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={handleClosed}
      type={isWeb ? 'modal' : 'bottom-sheet'}
      style={isWeb ? { maxWidth: 480 } : undefined}
    >
      <BottomSheetTitle
        title={t('Add owner')}
        subtitle={t('Paste an address, or pick from the ones you already have.')}
        onClose={closeBottomSheet}
        closeButtonTestID="safe-create-add-owner-close"
      />
      <AddressInput
        testID="safe-create-add-owner-address"
        value={addressState.fieldValue}
        onChangeText={handleChangeText}
        onScanAddress={handleChangeText}
        onSubmitEditing={handleAddEnteredAddress}
        validation={validation}
        resolvedAddress={addressState.resolvedAddress}
        resolvedAddressType={addressState.resolvedAddressType}
        isRecipientDomainResolving={addressState.isDomainResolving}
        placeholder={t('Address or ENS name')}
        // The sheet has the same color as the default input background, so use the focused
        // input color to keep the input visible and the same before and after focus
        backgroundColor={theme.tertiaryBackground}
        containerStyle={spacings.mb0}
      />
      {!!addressState.fieldValue && (
        <Button
          testID="safe-create-add-owner-button"
          text={t('Add owner')}
          onPress={handleAddEnteredAddress}
          disabled={!canAddEnteredAddress}
          hasBottomSpacing={false}
          style={spacings.mtSm}
        />
      )}
      {sections.map((section, index) => (
        <View key={section.key}>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.mtLg,
              spacings.mbTy
            ]}
          >
            <SafeCreateSectionLabel style={[spacings.mt0, spacings.mb0, spacings.mrSm]}>
              {section.title}
            </SafeCreateSectionLabel>
            {/* One search for both lists, next to the first of them */}
            {!index && (
              <Search
                control={searchControl}
                placeholder={t('Search')}
                height={SEARCH_HEIGHT}
                containerStyle={{ width: SEARCH_WIDTH }}
                testID="safe-create-add-owner-search"
              />
            )}
          </View>
          {section.owners.length ? (
            <OwnersCard
              owners={section.owners}
              onPick={handlePick}
              testIDPrefix={`safe-create-add-owner-${section.key}`}
            />
          ) : (
            <Text fontSize={14} appearance="secondaryText">
              {t('Nothing matches your search.')}
            </Text>
          )}
        </View>
      ))}
    </BottomSheet>
  )
}

export default React.memo(SafeCreateAddOwnerBottomSheet)
