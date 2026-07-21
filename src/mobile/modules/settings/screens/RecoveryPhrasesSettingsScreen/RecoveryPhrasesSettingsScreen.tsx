import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import SettingsWheelIcon from '@common/assets/svg/SettingsWheelIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import Account from '@common/modules/account-select/components/Account'
import ManageRecoveryPhrase from '@common/modules/settings/ManageRecoveryPhrase'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const RecoveryPhrasesSettingsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { statuses } = useController('StorageController').state
  const { accounts } = useController('AccountsController').state
  const { seeds, keys } = useController('KeystoreController').state
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const [recoveryPhraseToManage, setRecoveryPhraseToManage] = useState<{
    id: string
    label: string
    hdPathTemplate: HD_PATH_TEMPLATE_TYPE
  } | null>(null)

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

  const renderItem = ({
    item,
    index
  }: ListRenderItemInfo<
    NonNullable<ReturnType<typeof useController<'KeystoreController'>>['state']['seeds']>[number]
  >) => {
    const associatedAccounts = getAccountsForSeed(item.id)
    return (
      <Panel
        testID={`recovery-phrase-row-${item.id}`}
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
            !!associatedAccounts.length && spacings.mbSm
          ]}
        >
          <Text weight="medium" numberOfLines={1} style={flexbox.flex1}>
            {item.label}
          </Text>
          <Button
            testID={`manage-recovery-phrase-${item.id}`}
            size="small"
            type="ghost"
            childrenPosition="left"
            text={t('Manage')}
            hasBottomSpacing={false}
            onPress={() => setRecoveryPhraseToManage(item)}
            style={spacings.ph0}
            innerContainerStyle={() => spacings.ph0 as ViewStyle}
          >
            <SettingsWheelIcon
              width={20}
              height={20}
              style={spacings.mrMi}
              color={theme.primaryText}
            />
          </Button>
        </View>
        {associatedAccounts.map((a) => {
          return (
            <Account
              key={a.addr}
              account={a}
              withSettings={false}
              isSelectable={false}
              containerStyle={{
                marginBottom: 0,
                paddingHorizontal: 0,
                minHeight: 82,
                maxHeight: 82
              }}
              withKeyType={false}
              withCopy={false}
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
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent title={t('Recovery phrases')} withBackButton>
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
              {t("You don't have any recovery phrases added to the wallet.")}
            </Text>
          </View>
        )}
      </MobileLayoutWrapperMainContent>

      <BottomSheet
        sheetRef={sheetRef}
        id="manage-recovery-phrase-bottom-sheet"
        type="bottom-sheet"
        onBackdropPress={() => {
          setRecoveryPhraseToManage(null)
          closeBottomSheet()
        }}
        closeBottomSheet={() => {
          setRecoveryPhraseToManage(null)
          closeBottomSheet()
        }}
        containerInnerWrapperStyles={{ flex: 1 }}
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
    </MobileLayoutContainer>
  )
}

export default React.memo(RecoveryPhrasesSettingsScreen)
