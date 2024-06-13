import React from 'react'

import BackButton from '@common/components/BackButton'
import Panel from '@common/components/Panel'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import HotWalletCreateCards from '@web/modules/auth/components/HotWalletCreateCards'

const HotWalletCreateSelectorScreen = () => {
  const { t } = useTranslation()
  const { accounts } = useAccountsControllerState()
  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const { isReadyToStoreKeys } = useKeystoreControllerState()

  const onOptionPress = async (flow: 'email' | 'create-seed') => {
    if (!isReadyToStoreKeys) {
      navigate(WEB_ROUTES.keyStoreSetup, { state: { flow } })
      return
    }
    if (flow === 'email') {
      // @TODO: Implement email vault
      return
    }
    if (flow === 'create-seed') {
      navigate(WEB_ROUTES.createSeedPhrasePrepare)
    }
  }

  return (
    <TabLayoutContainer
      width="full"
      backgroundColor={theme.secondaryBackground}
      header={<Header withAmbireLogo />}
      footer={
        <BackButton
          fallbackBackRoute={accounts.length ? WEB_ROUTES.dashboard : WEB_ROUTES.getStarted}
        />
      }
    >
      <TabLayoutWrapperMainContent>
        <Panel
          style={{
            width: 'fit-content',
            marginHorizontal: 'auto'
          }}
          title={t('Select one of the following options')}
        >
          <HotWalletCreateCards
            handleEmailPress={() => onOptionPress('email')}
            handleSeedPress={() => onOptionPress('create-seed')}
          />
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default HotWalletCreateSelectorScreen
