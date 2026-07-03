import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import SearchIcon from '@common/assets/svg/SearchIcon'
import Button from '@common/components/Button'
import { PanelBackButton } from '@common/components/Panel/Panel'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import OptOutControlOption from '@common/modules/settings/components/PrivacyOptOuts/OptOutControlOption'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

import getStyles from './styles'

const PrivacyOptOutsConfiguration = () => {
  const { styles } = useTheme(getStyles)
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
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(PrivacyOptOutsConfiguration)
