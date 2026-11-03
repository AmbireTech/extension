import React, { useCallback } from 'react'
import { useModalize } from 'react-native-modalize'

import SafeIcon from '@common/assets/svg/SafeIcon'
import Banner from '@common/components/Banner'
import SafeActivationBottomSheet from '@common/components/SafeActivationBottomSheet'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

/**
 * Prompts the user to activate a Safe account created in the wallet that isn't active on
 * any network yet, as it can't be used before that. Gone once it's active on one network.
 */
const SafeActivationBanner = () => {
  const { t } = useTranslation()
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const accountAddr = account?.addr
  const selectIsActiveOnSomeNetwork = useCallback(
    (state: AllControllersMappingType['AccountsController']) => {
      const accountStatesByNetwork = accountAddr ? state.accountStates[accountAddr] : undefined
      // Unknown until the account states load, so the banner doesn't flash in meanwhile
      if (!accountStatesByNetwork || !Object.keys(accountStatesByNetwork).length) return null

      return Object.values(accountStatesByNetwork).some(({ isDeployed }) => isDeployed)
    },
    [accountAddr]
  )
  const { state: isActiveOnSomeNetwork } = useController(
    'AccountsController',
    selectIsActiveOnSomeNetwork
  )
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  // Only a Safe created in the wallet has what's needed to activate it from here
  if (!account?.safeCreation) return null

  return (
    <>
      {isActiveOnSomeNetwork === false && (
        <Banner
          type="info"
          isAccent
          CustomIcon={SafeIcon}
          title={t('Activate your Safe account')}
          text={t("It isn't active on any network yet. Activate it where you want to use it.")}
          buttonText={t('Activate')}
          onPress={openBottomSheet as () => void}
        />
      )}
      <SafeActivationBottomSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        account={account}
      />
    </>
  )
}

export default React.memo(SafeActivationBanner)
