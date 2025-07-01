import React, { ReactElement, useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useStorageControllerState from '@web/hooks/useStorageControllerState'
import Account from '@web/modules/account-select/components/Account'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'
import ManageRecoveryPhrase from '@web/modules/settings/ManageRecoveryPhrase'

const RecoveryPhraseSettingsScreen = () => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const { statuses } = useStorageControllerState()
  const { accounts } = useAccountsControllerState()
  const { seeds, keys } = useKeystoreControllerState()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const [recoveryPhraseToManage, setRecoveryPhraseToManage] = useState<{
    id: string
    label: string
    hdPathTemplate: HD_PATH_TEMPLATE_TYPE
  } | null>(null)
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  useEffect(() => {
    setCurrentSettingsPage('recovery-phrases')
  }, [setCurrentSettingsPage])

  const getAccountsForSeed = useCallback(
    (seedId: string) => {
      const keysFromSeed = keys.filter((k) => k.meta.fromSeedId === seedId)
      const keysFromSeedAddr = keysFromSeed.map(({ addr }) => addr)
      return accounts.filter((a) => a.associatedKeys.some((k) => keysFromSeedAddr.includes(k)))
    },
    [keys, accounts]
  )

  useEffect(() => {
    if (recoveryPhraseToManage) openBottomSheet()
  }, [openBottomSheet, recoveryPhraseToManage])

  const renderItem = ({ item, index }: any): ReactElement<any, any> => {
    const associatedAccounts = getAccountsForSeed(item.id)
    return (
      <Panel
        spacingsSize="small"
        style={{
          marginBottom: index < seeds.length - 1 ? SPACING_TY : 0,
          backgroundColor: theme.secondaryBackground
        }}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            !!associatedAccounts.length && spacings.mbMd
          ]}
        >
          <Text weight="medium" numberOfLines={1} style={flexbox.flex1}>
            {item.label}
          </Text>
          <Button
            size="small"
            type="ghost"
            text={t('Manage')}
            textStyle={{ color: theme.primary }}
            hasBottomSpacing={false}
            style={spacings.ph0}
            onPress={() => setRecoveryPhraseToManage(item)}
          >
            <SettingsIcon
              width={18}
              height={18}
              color={theme.primary}
              style={spacings.mlTy}
              strokeWidth="1.7"
            />
          </Button>
        </View>
        {associatedAccounts.map((a, accIdx) => {
          return (
            <Account
              key={a.addr}
              account={a}
              withSettings={false}
              isSelectable={false}
              containerStyle={{
                borderWidth: 1,
                borderColor: theme.secondaryBorder,
                backgroundColor: theme.secondaryBackground,
                marginBottom: accIdx < associatedAccounts.length - 1 ? SPACING_TY : 0
              }}
              withKeyType={false}
            />
          )
        })}
        {!associatedAccounts.length && (
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
      </Panel>
    )
  }

  return (
    <View style={flexbox.flex1}>
      <SettingsPageHeader title={t('Recovery phrases')} />
      {seeds.length ? (
        <FlatList data={seeds} renderItem={renderItem} keyExtractor={(item) => item.id} />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            flexbox.flex1,
            flexbox.alignCenter,
            flexbox.justifyCenter
          ]}
        >
          <Text style={text.center}>
            {t("You don't have any recovery phrases added to the extension.")}
          </Text>
        </View>
      )}

      <BottomSheet
        sheetRef={sheetRef}
        id="manage-recovery-phrase-bottom-sheet"
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
        onBackdropPress={() => {
          setRecoveryPhraseToManage(null)
          closeBottomSheet()
        }}
        closeBottomSheet={() => {
          setRecoveryPhraseToManage(null)
          closeBottomSheet()
        }}
        scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
        containerInnerWrapperStyles={{ flex: 1 }}
        style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg }}
      >
        {!!recoveryPhraseToManage && (
          <ManageRecoveryPhrase
            recoveryPhrase={recoveryPhraseToManage}
            onBackButtonPress={() => {
              setRecoveryPhraseToManage(null)
              closeBottomSheet()
            }}
          />
        )}
      </BottomSheet>
    </View>
  )
}

export default React.memo(RecoveryPhraseSettingsScreen)
