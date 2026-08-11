import React from 'react'
import { useTranslation } from 'react-i18next'

import LightningIcon from '@common/assets/svg/LightningIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import Button from '@common/components/Button'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import OptOutControlOption from '@common/modules/settings/components/PrivacyOptOuts/OptOutControlOption'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const PrivacyOptOutsConfiguration = () => {
  const { theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()

  return (
    <MobileLayoutContainer
      footer={
        <Button
          type="primary"
          style={{ minWidth: 220 }}
          hasBottomSpacing={false}
          onPress={() => navigate(ROUTES.getStarted)}
          text={t('Confirm and go back')}
        />
      }
    >
      <MobileLayoutWrapperMainContent withBackButton title="Privacy Opt-outs">
        <OptOutControlOption
          title={t('Tokens, NFTs & DeFi positions auto discovery')}
          description={t('Fetch tokens and positions via Ambire API, using third party providers')}
          icon={<SearchIcon width={24} height={24} />}
          flag="tokenAndDefiAutoDiscovery"
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
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(PrivacyOptOutsConfiguration)
