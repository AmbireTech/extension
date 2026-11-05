import React, { useCallback } from 'react'
import { useModalize } from 'react-native-modalize'

import SafeIcon from '@common/assets/svg/SafeIcon'
import Banner from '@common/components/Banner'
import SafeActivationBottomSheet from '@common/components/SafeActivationBottomSheet'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

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
          // One line, as the dashboard lets a short page scroll as far as its banners are tall
          singleRow
          buttonText={t('Activate')}
          onPress={openBottomSheet as () => void}
          // The same as the top padding, so the single row sits in the middle (web pads the
          // bottom more, for a banner with text under its title)
          style={spacings.pbTy}
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
