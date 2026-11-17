import React, { useCallback } from 'react'
import { ViewStyle } from 'react-native'

import Alert from '@common/components/Alert'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import getFeatureFlagUpdates from '@common/modules/settings/components/PrivacyOptOuts/OptOutControlOption/getFeatureFlagUpdates'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectIsUnlocked = (state: AllControllersMappingType['KeystoreController']) =>
  state.isUnlocked

/**
 * Shown on the Email Vault screens while the user has turned Email Vault off in the privacy
 * settings. Turning it back on also turns on the settings it requires (Ambire analytics).
 * Settings can't be changed while the wallet is locked, so it can be turned on only when unlocked.
 */
const EmailVaultDisabledAlert = ({ style }: { style?: ViewStyle }) => {
  const { t } = useTranslation()
  const { dispatch: featureFlagsDispatch } = useController('FeatureFlagsController')
  const { state: isUnlocked } = useController('KeystoreController', selectIsUnlocked)

  const handleEnable = useCallback(() => {
    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlags',
        args: [getFeatureFlagUpdates('emailVault', true)]
      }
    })
  }, [featureFlagsDispatch])

  return (
    <Alert
      type="info"
      isTypeLabelHidden
      style={style}
      title={t('Email vault is currently disabled')}
      titleWeight="semiBold"
      text={
        isUnlocked
          ? t(
              'You turned off Email Vault in the privacy settings. Enabling it also turns on anonymized analytics, which Email Vault needs to work.'
            )
          : t(
              'You turned off Email Vault in the privacy settings, so your password can not be reset by email.'
            )
      }
      buttonProps={isUnlocked ? { text: t('Enable'), onPress: handleEnable } : undefined}
    />
  )
}

export default React.memo(EmailVaultDisabledAlert)
