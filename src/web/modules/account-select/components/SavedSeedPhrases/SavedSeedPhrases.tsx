import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, View } from 'react-native'

import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Button from '@common/components/Button'
import Panel, { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useStorageControllerState from '@web/hooks/useStorageControllerState'
import Account from '@web/modules/account-select/components/Account'

const SavedSeedPhrases = ({ handleClose }: { handleClose: () => void }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { statuses } = useStorageControllerState()
  const { accounts } = useController('AccountsController').state
  const { seeds, keys } = useKeystoreControllerState()
  const { dispatch } = useControllersMiddleware()
  const { subType, initParams } = useAccountPickerControllerState()
  const [addAccountButtonPressed, setAddAccountButtonPressed] = useState(false)
  const { goToNextRoute } = useOnboardingNavigation()
  const { navigate } = useNavigation()

  useEffect(() => {
    if (addAccountButtonPressed && initParams && subType === 'seed') {
      setAddAccountButtonPressed(false)
      goToNextRoute(WEB_ROUTES.accountPersonalize)
    }
  }, [addAccountButtonPressed, goToNextRoute, dispatch, initParams, subType])

  const getAccountsForSeed = useCallback(
    (seedId: string) => {
      const keysFromSeed = keys.filter((k) => k.meta.fromSeedId === seedId)
      const keysFromSeedAddr = keysFromSeed.map(({ addr }) => addr)
      return accounts.filter((a) => a.associatedKeys.some((k) => keysFromSeedAddr.includes(k)))
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
  }: ListRenderItemInfo<ReturnType<typeof useKeystoreControllerState>['seeds'][number]>) => {
    const seedAccounts = getAccountsForSeed(item.id) || []

    return (
      <Panel spacingsSize="small" style={index < seeds.length - 1 && spacings.mbTy}>
        <Text weight="medium" numberOfLines={1} style={spacings.mbLg}>
          {item.label}
        </Text>
        {seedAccounts.map((a) => {
          return (
            <Account
              key={a.addr}
              account={a}
              withSettings={false}
              isSelectable={false}
              containerStyle={{
                borderWidth: 1,
                borderColor: theme.secondaryBorder,
                backgroundColor: theme.primaryBackground
              }}
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
        <View style={spacings.ptMd}>
          <Button
            text={t('+ Add account')}
            hasBottomSpacing={false}
            onPress={() => handleAddAddressFromSeed(item.id)}
          />
        </View>
      </Panel>
    )
  }

  return (
    <View style={[spacings.ptSm, flexbox.flex1]}>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
        <PanelBackButton onPress={handleClose} style={spacings.mrSm} />
        <PanelTitle title={t('Add from stored recovery phrases')} style={text.left} />
        <Button
          size="small"
          type="gray"
          text={t('Manage phrases')}
          hasBottomSpacing={false}
          onPress={() => {
            navigate(WEB_ROUTES.recoveryPhrasesSettings)
          }}
        >
          <SettingsIcon
            width={18}
            height={18}
            color={theme.primaryText}
            style={spacings.mlTy}
            strokeWidth="1.7"
          />
        </Button>
      </View>
      <FlatList data={seeds} renderItem={renderItem} keyExtractor={(item) => item.id} />
    </View>
  )
}

export default React.memo(SavedSeedPhrases)
