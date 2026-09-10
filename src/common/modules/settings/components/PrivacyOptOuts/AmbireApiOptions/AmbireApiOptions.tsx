import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AccountsIcon from '@common/assets/svg/AccountsIcon'
import AmbireLogoSquare from '@common/assets/svg/AmbireLogoSquare'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import ValueIcon from '@common/assets/svg/ValueIcon'
import ExpandableCard from '@common/components/ExpandableCard'
import Text from '@common/components/Text'
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
            title={t('Gas Tank')}
            description={t('Pay network fees cross chain')}
            icon={<GasTankIcon width={24} height={24} color={theme.iconPrimary} />}
            flag="gasTank"
          />
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
              'Fetch tokens and positions via Ambire API, using third party providers'
            )}
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
            title={t('Ambire Smart accounts')}
            description={t(
              'Find and manage Ambire V1 smart accounts. Newly created V2 accounts are unaffected'
            )}
            icon={<AccountsIcon width={24} height={24} color={theme.iconPrimary} />}
            flag="ambireSmartAccounts"
          />
          <OptOutControlOption
            title={t('Token prices')}
            description={t(
              `Fetch token prices through Ambire's API. Needed for Gas Tank and token payments`
            )}
            icon={<ValueIcon width={24} height={24} color={theme.iconPrimary} />}
            flag="tokenPrices"
          />
        </View>
      }
    />
  )
}

export default React.memo(AmbireApiOptions)
