import React, { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import { Dapp } from '@ambire-common/interfaces/dapp'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import DAppAccountList from '@common/modules/dapp-catalog/components/DAppAccountList'
import ToggleDAppScopedAccounts from '@common/modules/dapp-catalog/components/ToggleDAppScopedAccounts'
import useDAppAccountPreferences from '@common/modules/dapp-catalog/hooks/useDAppAccountPreferences'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = Pick<Dapp, 'id' | 'accountPreferences'>

const DAppConnectAccountSettings: FC<Props> = ({ id, accountPreferences }) => {
  const { ref, open, close } = useModalize()
  const { t } = useTranslation()
  const {
    accounts,
    selectedAccount,
    orderedAccountList,
    localPreferences,
    toggleSelectAccount,
    toggleOnlyConnectWithSomeAccounts,
    updateOrderedAccountList,
    updateLocalPreferences,
    save
  } = useDAppAccountPreferences(id, 'dappToConnect', accountPreferences)

  const handleOpenBottomSheet = useCallback(() => {
    open()
    updateLocalPreferences(accountPreferences)
  }, [open, accountPreferences, updateLocalPreferences])

  const handleCloseBottomSheet = useCallback(() => {
    close()
    // Update the order on close
    updateOrderedAccountList()
  }, [close, updateOrderedAccountList])

  // No need to display this if there is only 1 account available, as there is no choice to be made.
  if (accounts.length <= 1 || !selectedAccount) return null

  return (
    <>
      <ToggleDAppScopedAccounts
        enabled={!!localPreferences?.enabled}
        selectedCount={localPreferences?.accounts.length || 0}
        onToggle={toggleOnlyConnectWithSomeAccounts}
        onOpenAccountSelector={handleOpenBottomSheet}
      />
      <BottomSheet
        id="dapp-connect-account-selector"
        sheetRef={ref}
        style={{ maxWidth: 624, ...spacings.pb0 }}
        containerInnerWrapperStyles={flexbox.flex1}
        closeBottomSheet={handleCloseBottomSheet}
        isScrollEnabled={false}
      >
        <ModalHeader title={t('Select which accounts you want to connect with the app')} />
        <DAppAccountList
          accounts={orderedAccountList}
          allowedAccounts={localPreferences?.accounts || []}
          onToggleAccount={toggleSelectAccount}
          enforce="selected"
        />
        <FooterGlassView>
          <Button
            type="secondary"
            text={t('Cancel')}
            onPress={handleCloseBottomSheet}
            hasBottomSpacing={false}
            style={{ ...spacings.mrLg, width: 120 }}
          />
          <Button
            onPress={() => {
              save()
              handleCloseBottomSheet()
            }}
            style={{ width: 160 }}
            text={t('Continue')}
            hasBottomSpacing={false}
          />
        </FooterGlassView>
      </BottomSheet>
    </>
  )
}

export default React.memo(DAppConnectAccountSettings)
