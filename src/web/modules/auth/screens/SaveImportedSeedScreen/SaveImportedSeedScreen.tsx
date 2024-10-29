import React, { useCallback, useEffect } from 'react'
import { View } from 'react-native'

import ImportAccountsFromSeedPhraseIcon from '@common/assets/svg/ImportAccountsFromSeedPhraseIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useStepper from '@common/modules/auth/hooks/useStepper'
import Header from '@common/modules/header/components/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { iconColors } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import Stepper from '@web/modules/router/components/Stepper'

const PrivateKeyImportScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  // const { dispatch } = useBackgroundService()
  const keystoreState = useKeystoreControllerState()
  const { updateStepperState } = useStepper()

  useEffect(() => {
    updateStepperState(WEB_ROUTES.saveImportedSeed, 'seed-with-option-to-save')
  }, [updateStepperState])

  useEffect(() => {
    if (keystoreState.hasKeystoreSavedSeed) navigate(WEB_ROUTES.dashboard)
  }, [keystoreState.hasKeystoreSavedSeed, navigate])

  const handleSaveSeedAndProceed = useCallback(() => {
    // dispatch({
    //   type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_PRIVATE_KEY_OR_SEED_PHRASE',
    //   params: { privKeyOrSeed: seedPhrase, shouldPersist: true }
    // })
  }, [])

  const handleDoNotSaveSeedAndProceed = useCallback(() => {
    // dispatch({
    //   type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_PRIVATE_KEY_OR_SEED_PHRASE',
    //   params: { privKeyOrSeed: seedPhrase }
    // })
  }, [])

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      width="md"
      header={
        <Header mode="custom-inner-content" withAmbireLogo>
          <Stepper />
        </Header>
      }
    >
      <TabLayoutWrapperMainContent>
        <Panel title={t('Save the imported seed')}>
          <View style={[flexbox.directionRow]}>
            <ImportAccountsFromSeedPhraseIcon style={spacings.mrLg} color={iconColors.primary} />
            <View>
              <Text style={spacings.mbTy} appearance="secondaryText">
                {t('Do you want to save the seed in the Ambire Wallet extension?')}
              </Text>
              <Text style={spacings.mbTy} appearance="secondaryText">
                {t(
                  'This will allow you to easily import more accounts from this Seed Phrase.\nAlso, you will be able to delete it anytime from settings'
                )}
              </Text>
              <Text appearance="secondaryText" weight="semiBold">
                {t('You can save only one seed.')}
              </Text>
            </View>
          </View>
          <View style={[flexbox.directionRow, spacings.mt2Xl]}>
            <Button
              text="Save"
              onPress={handleSaveSeedAndProceed}
              type="primary"
              size="large"
              style={spacings.mrTy}
            />
            <Button
              onPress={handleDoNotSaveSeedAndProceed}
              type="secondary"
              text="Don't save"
              size="large"
            />
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default PrivateKeyImportScreen
