import React from 'react'
import { View } from 'react-native'

import EnsIcon from '@common/assets/svg/EnsIcon'
import LightningIcon from '@common/assets/svg/LightningIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import CrashAnalyticsControlOption from '@common/modules/settings/components/General/CrashAnalyticsControlOption'
import OptOutControlOption from '@common/modules/settings/components/PrivacyOptOuts/OptOutControlOption'
import spacings from '@common/styles/spacings'

const PrivacyOptOutsList = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View style={isWeb && spacings.mb2Xl}>
      <OptOutControlOption
        title={t('Tokens, NFTs & DeFi positions auto discovery')}
        description={t('Fetch tokens and positions via Ambire API, using third party providers')}
        icon={<SearchIcon width={24} height={24} />}
        flag="tokenAndDefiAutoDiscovery"
      />
      <OptOutControlOption
        title={t('Transaction arguments decoding')}
        description={t(
          `Use Ambire's API to decode transaction arguments and show action names when signing calls`
        )}
        icon={<SearchIcon width={24} height={24} />}
        flag="apiForFunctionSelectors"
      />
      <OptOutControlOption
        title={t('Keep ENS profiles up to date')}
        description={t(
          'Automatically update ENS names and avatars in the background. This improves freshness, but may reduce privacy by linking your accounts together.'
        )}
        icon={<EnsIcon width={20} height={20} color={theme.iconPrimary} />}
        flag="keepEnsProfilesUpToDate"
      />
      <OptOutControlOption
        title={t('ERC-4337 smart account features')}
        description={t(
          'Use bundlers and paymasters for smart account gas estimation, gas tank, sponsored gas, and token fee payments.'
        )}
        icon={<LightningIcon width={24} height={24} color={theme.iconPrimary} />}
        flag="erc4337"
      />
      <OptOutControlOption
        title={t('ERC-7702 smart account features')}
        description={t(
          `Do not upgrade standard EOA accounts to smart accounts (disabling this doesn't auto revoke all delegations you have set up on your accounts)`
        )}
        icon={<LightningIcon width={24} height={24} color={theme.iconPrimary} />}
        flag="eip7702"
      />
      <CrashAnalyticsControlOption />
    </View>
  )
}

export default React.memo(PrivacyOptOutsList)
