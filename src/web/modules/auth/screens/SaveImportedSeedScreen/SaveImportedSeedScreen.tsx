import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'

import ImportAccountsFromSeedPhraseIcon from '@common/assets/svg/ImportAccountsFromSeedPhraseIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useStepper from '@common/modules/auth/hooks/useStepper'
import Header from '@common/modules/header/components/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { iconColors } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { delayPromise } from '@common/utils/promises'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'

const PrivateKeyImportScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const { dispatch } = useBackgroundService()
  const keystoreState = useKeystoreControllerState()
  const { updateStepperState } = useStepper()
  const { addToast } = useToast()
  const [clickedSkip, setClickedSkip] = useState<boolean>(false)
  const [clickedSave, setClickedSave] = useState<boolean>(false)

  useEffect(() => {
    updateStepperState(WEB_ROUTES.saveImportedSeed, 'seed-with-option-to-save')
  }, [updateStepperState])

  useEffect(() => {
    if (keystoreState.hasKeystoreSavedSeed || !keystoreState.hasKeystoreTempSeed)
      navigate(WEB_ROUTES.dashboard)
  }, [keystoreState.hasKeystoreSavedSeed, keystoreState.hasKeystoreTempSeed, navigate])

  useEffect(() => {
    if (keystoreState.statuses.moveTempSeedToKeystoreSeeds === 'SUCCESS') {
      addToast(t('Seed Phrase successfully saved'))
      navigate(WEB_ROUTES.dashboard)
    }
  }, [keystoreState.statuses.moveTempSeedToKeystoreSeeds, navigate, addToast, t])

  const handleSaveSeedAndProceed = useCallback(() => {
    dispatch({
      type: 'KEYSTORE_CONTROLLER_MOVE_SEED_FROM_TEMP',
      params: { action: 'save' }
    })
    setClickedSave(true)
  }, [dispatch, setClickedSave])

  const handleDoNotSaveSeedAndProceed = useCallback(async () => {
    setClickedSkip(true)

    dispatch({
      type: 'KEYSTORE_CONTROLLER_MOVE_SEED_FROM_TEMP',
      params: { action: 'delete' }
    })

    // wait a bit before navigating for better UX
    await delayPromise(600)

    navigate(WEB_ROUTES.dashboard)
  }, [dispatch, navigate, setClickedSkip])

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      width="md"
      header={<Header withAmbireLogo />}
    >
      <TabLayoutWrapperMainContent>
        <Panel title={t('Save your seed')}>
          <View style={[flexbox.directionRow]}>
            <ImportAccountsFromSeedPhraseIcon style={spacings.mrLg} color={iconColors.primary} />
            <View>
              <Text style={spacings.mbTy} appearance="secondaryText">
                {t('Do you want to save the seed in the Ambire Wallet extension?')}
              </Text>
              <Text style={spacings.mbTy} appearance="secondaryText">
                {t('This will let you easily add more Basic (EOA) and Smart Accounts from it.')}
              </Text>
              <Alert
                type="warning"
                title={t(
                  'Only one seed phase can be stored.\nYou can delete it anytime in the "Saved Seed Phrase" settings\nwithout affecting the imported accounts.'
                )}
              />
            </View>
          </View>
          <View style={[flexbox.directionRow, spacings.mt2Xl]}>
            <Button
              testID="save-seed-button"
              text={!clickedSave ? t('Save') : t('Saving...')}
              onPress={handleSaveSeedAndProceed}
              type="primary"
              size="large"
              style={spacings.mrTy}
            />
            <Button
              testID="do-not-save-seed-button"
              onPress={handleDoNotSaveSeedAndProceed}
              type="secondary"
              text={!clickedSkip ? t('Skip') : t('Skipping...')}
              size="large"
            />
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default PrivateKeyImportScreen
