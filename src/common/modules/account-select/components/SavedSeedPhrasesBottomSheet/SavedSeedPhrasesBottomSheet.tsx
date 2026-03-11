import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, Pressable, View } from 'react-native'
import { IHandles } from 'react-native-modalize/lib/options'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import SettingsWheelIcon from '@common/assets/svg/SettingsWheelIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Account from '@common/modules/account-select/components/Account'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import alert from '@common/services/alert'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

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
  const { statuses } = useController('StorageController').state
  const { accounts } = useController('AccountsController').state
  const { seeds, keys } = useController('KeystoreController').state
  const { dispatch } = useControllersMiddleware()
  const { subType, initParams } = useController('AccountPickerController').state
  const [addAccountButtonPressed, setAddAccountButtonPressed] = useState(false)
  const { goToNextRoute } = useOnboardingNavigation()
  const { navigate } = useNavigation()

  useEffect(() => {
    if (addAccountButtonPressed && initParams && subType === 'seed') {
      setAddAccountButtonPressed(false)
      goToNextRoute(WEB_ROUTES.accountPersonalize)
    }
  }, [addAccountButtonPressed, goToNextRoute, initParams, subType])

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

  const handleAddAddressFromSeed = useCallback(
    (id: string) => {
      setAddAccountButtonPressed(true)
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_FROM_SAVED_SEED_PHRASE',
        params: { id }
      })
    },
    [dispatch]
  )

  const renderItem = ({
    item,
    index
  }: ListRenderItemInfo<
    ReturnType<typeof useController<'KeystoreController'>>['state']['seeds'][number]
  >) => {
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
          <Text weight="medium" appearance="secondaryText" numberOfLines={1} style={spacings.plSm}>
            {item.label}
          </Text>
          <Button
            text={t('Add account')}
            hasBottomSpacing={false}
            size="smaller"
            type="secondary"
            onPress={() => handleAddAddressFromSeed(item.id)}
            childrenPosition="left"
          >
            <AddCircularIcon
              width={20}
              height={20}
              color={theme.primaryText}
              style={spacings.mrMi}
            />
          </Button>
        </View>
        {seedAccounts.map((a) => {
          return (
            <Account
              key={a.addr}
              account={a}
              withSettings={false}
              isSelectable={false}
              withKeyType={false}
            />
          )
        })}
        {!seedAccounts.length && (
          <Text
            fontSize={14}
            weight="medium"
            appearance="secondaryText"
            style={[spacings.mvM, text.center]}
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
    <BottomSheet
      id="seed-phrases-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={close}
      HeaderComponent={
        <ModalHeader handleClose={handleClose} title={t('Add from recovery phrase')}>
          <Pressable
            onPress={() => {
              if (isMobile) {
                alert('Coming soon!')
                return
              }
              navigate(WEB_ROUTES.recoveryPhrasesSettings)
            }}
          >
            {({ hovered }: any) => (
              <SettingsWheelIcon
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
  )
}

export default React.memo(SavedSeedPhrasesBottomSheet)
