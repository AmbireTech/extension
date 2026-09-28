import React from 'react'
import { View } from 'react-native'

import AccountsIcon from '@common/assets/svg/AccountsIcon'
import AmbireLogoSquare from '@common/assets/svg/AmbireLogoSquare'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import SidebarSecurityIcon from '@common/assets/svg/SidebarSecurityIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import ExpandableCard from '@common/components/ExpandableCard'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import OptOutControlOption from '@common/modules/settings/components/PrivacyOptOuts/OptOutControlOption'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const AmbireApiOptions = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <ExpandableCard
      isInitiallyExpanded
      arrowPosition="right"
      style={spacings.mbTy}
      content={
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvMi, spacings.phTy]}>
          <View style={spacings.mrTy}>
            <AmbireLogoSquare width={24} height={24} />
          </View>
          <Text fontSize={16} weight="medium">
            {t('Ambire API')}
          </Text>
        </View>
      }
      expandedContent={
        <View style={[spacings.plTy, spacings.pbTy]}>
          <OptOutControlOption
            title={t('Networks configuration')}
            description={t(
              `Fetch the latest network configuration data that's the most compatible with Ambire.`
            )}
            icon={<NetworksIcon width={24} height={24} />}
            flag="networkConfig"
          />
          <OptOutControlOption
            title={t('Tokens, NFTs & DeFi positions auto discovery')}
            description={t(
              'Fetch tokens, token icons and positions via Ambire API, using third party providers'
            )}
            icon={<SearchIcon width={24} height={24} />}
            flag="tokenAndDefiAutoDiscovery"
          />
          <OptOutControlOption
            title={t('Clear signing')}
            description={t(
              `Fetch the latest standard for translating transactions. If you turn this off, some transactions can become unreadable and your security is reduced.`
            )}
            icon={<SearchIcon width={24} height={24} />}
            flag="clearSigning"
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
            title={t('Ambire Smart accounts')}
            description={t(
              'Find and manage Ambire V1 smart accounts. Newly created V2 accounts are unaffected'
            )}
            icon={<AccountsIcon width={24} height={24} color={theme.iconPrimary} />}
            flag="ambireSmartAccounts"
          />
          <OptOutControlOption
            title={t('Scam & phishing checker')}
            description={t(`Check websites against Ambire's scam and phishing blocklist`)}
            icon={<SidebarSecurityIcon width={24} height={24} color={theme.iconPrimary} />}
            flag="scamAndPhishingChecker"
          />
          <OptOutControlOption
            title={t('Enrich swap and bridge token info & trending tokens')}
            description={t(
              'Show the exchanges a token is traded on when picking a token to receive. Show trending tokens. This sends the addresses of the listed tokens to Ambire’s price API.'
            )}
            icon={<SwapAndBridgeIcon width={24} height={24} color={theme.iconPrimary} />}
            flag="swapAndBridgeTokenInfo"
          />
        </View>
      }
    />
  )
}

export default React.memo(AmbireApiOptions)
