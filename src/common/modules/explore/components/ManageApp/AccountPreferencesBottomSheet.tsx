import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { Dapp } from '@ambire-common/interfaces/dapp'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import DAppAccountList from '@common/modules/dapp-catalog/components/DAppAccountList'
import ToggleDAppScopedAccounts from '@common/modules/dapp-catalog/components/ToggleDAppScopedAccounts'
import useDAppAccountPreferences from '@common/modules/dapp-catalog/hooks/useDAppAccountPreferences'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface AccountPreferencesBottomSheetProps {
  dapp: Dapp
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
}

const AccountPreferencesBottomSheet = ({
  dapp,
  sheetRef,
  closeBottomSheet
}: AccountPreferencesBottomSheetProps) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    orderedAccountList,
    toggleSelectAccount,
    toggleOnlyConnectWithSomeAccounts,
    localPreferences,
    updateLocalPreferences,
    save
  } = useDAppAccountPreferences(dapp.id, 'existingDapp', dapp.accountPreferences)

  const handleConfirm = useCallback(() => {
    save()
    closeBottomSheet()
  }, [save, closeBottomSheet])

  const handleCancel = useCallback(() => {
    closeBottomSheet()
  }, [closeBottomSheet])

  return (
    <BottomSheet
      id="manage-accounts"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      containerInnerWrapperStyles={flexbox.flex1}
      isScrollEnabled={false}
      onOpen={() => updateLocalPreferences(dapp.accountPreferences)}
      style={spacings.pb0}
    >
      <ModalHeader title={t('Manage accounts')} />
      <ToggleDAppScopedAccounts
        enabled={localPreferences?.enabled ?? false}
        selectedCount={localPreferences?.accounts.length || 0}
        onToggle={toggleOnlyConnectWithSomeAccounts}
      />
      <View style={[{ height: 1, backgroundColor: theme.primaryBorder }, spacings.mv]} />
      {localPreferences?.enabled ? (
        <>
          <Text fontSize={14} weight="medium" appearance="secondaryText" style={spacings.mb}>
            {t('Select which accounts you want to connect with the app')}
          </Text>

          <DAppAccountList
            accounts={orderedAccountList}
            allowedAccounts={localPreferences?.accounts || []}
            onToggleAccount={toggleSelectAccount}
          />
        </>
      ) : (
        /* Placeholder to rendering the content behind buttons */
        <View style={{ height: 120 }} />
      )}
      <FooterGlassView size="sm">
        <Button
          type="secondary"
          size="smaller"
          text={t('Cancel')}
          onPress={handleCancel}
          hasBottomSpacing={false}
          style={spacings.mrLg}
        />
        <Button
          type="primary"
          size="smaller"
          text={t('Confirm')}
          onPress={handleConfirm}
          hasBottomSpacing={false}
        />
      </FooterGlassView>
    </BottomSheet>
  )
}

export default React.memo(AccountPreferencesBottomSheet)
