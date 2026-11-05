import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, Pressable, View } from 'react-native'
import { IHandles } from 'react-native-modalize/lib/options'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import PassphraseBadge from '@common/components/PassphraseBadge'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Account from '@common/modules/account-select/components/Account'
import EnterSeedPassphraseBottomSheet, {
  EnteredSeedPassphrase,
  useSeedPassphraseGate
} from '@common/modules/account-select/components/EnterSeedPassphraseBottomSheet'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectStatuses = (state: AllControllersMappingType['StorageController']) => state.statuses
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

type SavedSeed = AllControllersMappingType['KeystoreController']['seeds'][number]

const SavedSeedPhrasesBottomSheet = ({
  sheetRef,
  open,
  close,
  handleClose
}: {
  sheetRef: React.RefObject<IHandles>
  open: (dest?: 'default' | 'top' | undefined) => void
  close: (dest?: 'default' | 'alwaysOpen' | undefined) => void
  handleClose: () => void
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: statuses } = useController('StorageController', selectStatuses)
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { seeds, keys } = useController('KeystoreController').state
  const { dispatchAndWait: mainDispatchAndWait } = useController('MainController')
  const [preparingSeedId, setPreparingSeedId] = useState<string | null>(null)
  const { goToNextRoute } = useOnboardingNavigation()
  const { navigate } = useNavigation()

  const getAccountsForSeed = useCallback(
    (seedId: string) => {
      const keysFromSeed = keys.filter((k) => k.meta.fromSeedId === seedId)
      const keysFromSeedAddr = keysFromSeed.map(({ addr }) => addr)
      return accounts.filter(
        (a) => !a.safeCreation && a.associatedKeys.some((k) => keysFromSeedAddr.includes(k))
      )
    },
    [keys, accounts]
  )

  const initAccountPickerFromSeed = useCallback(
    async (id: string, passphrase?: EnteredSeedPassphrase) => {
      setPreparingSeedId(id)
      try {
        // Sets the picker up with the phrase - personalize prepares its next account
        const reply = await mainDispatchAndWait<
          'accountPickerSetInitParamsFromSavedSeed',
          { isWrongPassphrase: boolean }
        >({
          type: 'method',
          params: {
            method: 'accountPickerSetInitParamsFromSavedSeed',
            args: [{ id, ...passphrase }]
          }
        })
        if (reply.isWrongPassphrase) return true

        goToNextRoute(WEB_ROUTES.accountPersonalize)
      } catch (error) {
        // The controller reports its own failures, here the button only becomes usable again
        console.error('Failed to prepare an account from the saved recovery phrase', error)
      } finally {
        setPreparingSeedId(null)
      }
      return false
    },
    [mainDispatchAndWait, goToNextRoute]
  )

  const {
    seedToEnterPassphraseFor,
    requestSeed: handleAddAddressFromSeed,
    handlePassphraseSubmit,
    unmountPassphraseSheet
  } = useSeedPassphraseGate(initAccountPickerFromSeed)

  const renderItem = ({ item, index }: ListRenderItemInfo<SavedSeed>) => {
    const seedAccounts = getAccountsForSeed(item.id) || []

    return (
      <View
        style={[
          index < seeds.length - 1 && spacings.mbTy,
          spacings.phSm,
          spacings.pvSm,
          {
            borderRadius: BORDER_RADIUS_PRIMARY,
            backgroundColor: theme.secondaryBackground
          }
        ]}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.justifySpaceBetween,
            flexbox.alignCenter,
            spacings.mbSm
          ]}
        >
          <View style={[flexbox.flex1, flexbox.alignStart, spacings.plSm, spacings.mrSm]}>
            <Text weight="medium" appearance="secondaryText" numberOfLines={1}>
              {item.label}
            </Text>
            {item.withPassphrase && (
              <PassphraseBadge passphraseLabel={item.passphraseLabel} style={spacings.mtMi} />
            )}
          </View>
          <Button
            text={t('Add account')}
            hasBottomSpacing={false}
            size="smaller"
            type="secondary"
            onPress={() => handleAddAddressFromSeed(item)}
            disabled={!!preparingSeedId}
            childrenPosition="left"
            // On mobile secondary buttons share the card's background, so it takes the web one
            style={isMobile ? { backgroundColor: theme.primaryBackground } : undefined}
          >
            <AddCircularIcon
              width={20}
              height={20}
              color={theme.primaryText}
              style={spacings.mrMi}
            />
          </Button>
        </View>
        {seedAccounts.map((a, accountIndex) => {
          return (
            <Account
              key={a.addr}
              account={a}
              withSettings={false}
              isSelectable={false}
              isOnSecondaryBackground
              withBadges={false}
              containerStyle={accountIndex === seedAccounts.length - 1 ? spacings.mb0 : undefined}
              withKeyType={false}
              withCopy={false}
            />
          )
        })}
        {!seedAccounts.length && (
          <Text
            fontSize={14}
            weight="medium"
            appearance="secondaryText"
            style={[spacings.mvMd, text.center]}
          >
            {item.id === 'legacy-saved-seed' &&
            statuses.associateAccountKeysWithLegacySavedSeedMigration !== 'INITIAL'
              ? t('Linking accounts to this recovery phrase. This may take a moment...')
              : t('No accounts added from this seed.')}
          </Text>
        )}
      </View>
    )
  }

  return (
    <>
      <BottomSheet
        id="seed-phrases-bottom-sheet"
        sheetRef={sheetRef}
        closeBottomSheet={close}
        HeaderComponent={
          <ModalHeader handleClose={handleClose} title={t('Add from recovery phrase')}>
            <Pressable
              onPress={() => {
                navigate(ROUTES.recoveryPhrasesSettings)
              }}
            >
              {({ hovered }: any) => (
                <SettingsIcon
                  width={28}
                  height={28}
                  color={hovered ? theme.primaryText : theme.iconPrimary}
                />
              )}
            </Pressable>
          </ModalHeader>
        }
        flatListProps={{
          data: seeds,
          renderItem,
          keyExtractor: (item) => item.id
        }}
      />
      {seedToEnterPassphraseFor && (
        <EnterSeedPassphraseBottomSheet
          seed={seedToEnterPassphraseFor}
          accountsCount={getAccountsForSeed(seedToEnterPassphraseFor.id).length}
          onSubmit={handlePassphraseSubmit}
          onClosed={unmountPassphraseSheet}
        />
      )}
    </>
  )
}

export default React.memo(SavedSeedPhrasesBottomSheet)
