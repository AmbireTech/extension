import React, { useMemo } from 'react'
import { View } from 'react-native'

import EmailVaultIcon from '@common/assets/svg/EmailVaultIcon'
import EnsIcon from '@common/assets/svg/EnsIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import LightningIcon from '@common/assets/svg/LightningIcon'
import TrendingIcon from '@common/assets/svg/TrendingIcon'
import ValueIcon from '@common/assets/svg/ValueIcon'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import CrashAnalyticsControlOption from '@common/modules/settings/components/General/CrashAnalyticsControlOption'
import AmbireApiOptions from '@common/modules/settings/components/PrivacyOptOuts/AmbireApiOptions'
import OptOutControlOption from '@common/modules/settings/components/PrivacyOptOuts/OptOutControlOption'
import SwapProviderControlOption from '@common/modules/settings/components/PrivacyOptOuts/SwapProviderControlOption'
import spacings from '@common/styles/spacings'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectHasKeystoreRecovery = (state: AllControllersMappingType['EmailVaultController']) =>
  state.hasKeystoreRecovery

const PrivacyOptOutsList = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const erc4337RequiredBy = useMemo(() => ({ flag: 'gasTank' as const, title: t('Gas Tank') }), [t])
  const tokenPricesRequiredBy = useMemo(
    () => ({ flag: 'erc4337' as const, title: t('ERC-4337') }),
    [t]
  )
  const ambireAnalyticsRequiredBy = useMemo(
    () => ({ flag: 'emailVault' as const, title: t('Email Vault') }),
    [t]
  )
  // Opting out of Email Vault would leave the recovery secret with Ambire, so email recovery
  // has to be turned off (which deletes it) first, on its own screen
  const { state: hasKeystoreRecovery } = useController(
    'EmailVaultController',
    selectHasKeystoreRecovery
  )
  const emailVaultAction = useMemo(
    () =>
      hasKeystoreRecovery
        ? {
            text: t('Disable recovery first'),
            onPress: () => navigate(ROUTES.devicePasswordRecovery)
          }
        : undefined,
    [hasKeystoreRecovery, navigate, t]
  )
  const ambireAnalyticsOption = (
    <OptOutControlOption
      title={t('Anonymized analytics')}
      description={t(
        "Share the app version, an anonymous ID of this installation and your account balance with Ambire's servers. Disables informational banners"
      )}
      icon={<TrendingIcon width={24} height={24} color={theme.iconPrimary} />}
      flag="ambireAnalytics"
      // Mobile has no Email Vault, so nothing there needs analytics
      requiredBy={isMobile ? undefined : ambireAnalyticsRequiredBy}
    />
  )

  return (
    <View style={isWeb && spacings.mb2Xl}>
      <AmbireApiOptions />
      <OptOutControlOption
        title={t('Gas Tank')}
        description={t(
          'Pay network fees cross chain. Requires ERC-4337 smart account features and Token prices.'
        )}
        icon={<GasTankIcon width={24} height={24} color={theme.iconPrimary} />}
        flag="gasTank"
      />
      <View style={[spacings.mlLg, spacings.plTy]}>
        <OptOutControlOption
          title={t('ERC-4337 smart account features')}
          description={t(
            'Use bundlers and paymasters for smart account gas estimation, Gas Tank, sponsored gas, and token fee payments. Requires Token prices.'
          )}
          icon={<LightningIcon width={24} height={24} color={theme.iconPrimary} />}
          flag="erc4337"
          requiredBy={erc4337RequiredBy}
        />
        <OptOutControlOption
          title={t('Token prices')}
          description={t(`Fetch token prices through Ambire's API`)}
          icon={<ValueIcon width={24} height={24} color={theme.iconPrimary} />}
          flag="tokenPrices"
          requiredBy={tokenPricesRequiredBy}
        />
      </View>
      {isMobile ? (
        ambireAnalyticsOption
      ) : (
        <>
          <OptOutControlOption
            title={t('Email Vault')}
            description={t(
              'Reset your extension password by email if you forget it. Requires anonymized analytics.'
            )}
            icon={<EmailVaultIcon width={24} height={24} color={theme.iconPrimary} />}
            flag="emailVault"
            action={emailVaultAction}
          />
          <View style={[spacings.mlLg, spacings.plTy]}>{ambireAnalyticsOption}</View>
        </>
      )}
      <OptOutControlOption
        title={t('ERC-7702 smart account features')}
        description={t(
          `Do not upgrade standard EOA accounts to smart accounts (disabling this doesn't auto revoke any delegations you have set up on your accounts)`
        )}
        icon={<LightningIcon width={24} height={24} color={theme.iconPrimary} />}
        flag="eip7702"
      />
      <OptOutControlOption
        title={t('Keep ENS profiles up to date')}
        description={t(
          'Automatically update ENS names and load profile pictures. This improves freshness, but may reduce privacy by linking your accounts together.'
        )}
        icon={<EnsIcon width={20} height={20} color={theme.iconPrimary} />}
        flag="keepEnsProfilesUpToDate"
      />
      <SwapProviderControlOption />
      <CrashAnalyticsControlOption />
      <OptOutControlOption
        title={t('Send signing reports to Ledger')}
        description={t(
          'To protect your privacy, Ambire disables Ledger’s signing reports by default. The official Ledger integration otherwise sends Ledger a report every time you approve a transaction or signature, including the network, the address you interact with, your device model and software versions, and whether the details were shown in a readable way.'
        )}
        icon={<LedgerLetterIcon width={24} height={24} color={theme.iconPrimary} />}
        flag="ledgerSigningReports"
      />
    </View>
  )
}

export default React.memo(PrivacyOptOutsList)
