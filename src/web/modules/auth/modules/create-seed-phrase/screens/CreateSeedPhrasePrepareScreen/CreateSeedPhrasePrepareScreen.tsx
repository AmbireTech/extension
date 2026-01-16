import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'

import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Panel from '@common/components/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import Header from '@common/modules/header/components/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'

const CHECKBOXES = [
  {
    id: 0,
    label: 'Your recovery phrase is private. Keep it safe and never share it.'
  },
  {
    id: 1,
    label: 'If your recovery phrase is at risk, so is your account.'
  },
  {
    id: 2,
    label: 'Use your recovery phrase only to access or recover your wallet.'
  }
]

const CreateSeedPhrasePrepareScreen = () => {
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [checkboxesState, setCheckboxesState] = useState([false, false, false])
  const allCheckboxesChecked = checkboxesState.every((checkbox) => checkbox)

  const { dispatch } = useBackgroundService()

  const { getExtraEntropy } = useExtraEntropy()

  useEffect(() => {
    dispatch({ type: 'KEYSTORE_CONTROLLER_SEND_TEMP_SEED_TO_UI' })
  }, [dispatch])

  const handleSubmit = useCallback(() => {
    dispatch({
      type: 'KEYSTORE_CONTROLLER_GENERATE_TEMP_SEED',
      params: { extraEntropy: getExtraEntropy() }
    })

    goToNextRoute(WEB_ROUTES.createSeedPhraseWrite)
  }, [getExtraEntropy, goToNextRoute, dispatch])

  const handleCheckboxPress = (id: number) => {
    setCheckboxesState((prevState) => {
      const newState = [...prevState]
      newState[id] = !prevState[id]
      return newState
    })
  }

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      header={<Header mode="custom-inner-content" withAmbireLogo />}
    >
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          step={1}
          totalSteps={2}
          title="Create new recovery phrase"
          withBackButton
          onBackButtonPress={goToPrevRoute}
        >
          <Text weight="medium" appearance="secondaryText" style={[spacings.mbXl, text.center]}>
            {t('Before you begin, check these security tips.')}
          </Text>
          <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={{ flexGrow: 1 }}>
            {CHECKBOXES.map(({ id, label }, index) => (
              <View
                key={id}
                style={[
                  spacings.pvSm,
                  spacings.phSm,
                  flexbox.directionRow,
                  spacings.mbSm,
                  {
                    backgroundColor: theme.secondaryBackground,
                    borderRadius: BORDER_RADIUS_PRIMARY
                  }
                ]}
              >
                <Checkbox
                  style={spacings.mb0}
                  value={checkboxesState[id]}
                  onValueChange={() => {
                    handleCheckboxPress(id)
                  }}
                />
                <Pressable
                  testID={`create-seed-prepare-checkbox-${index}`}
                  style={flexbox.flex1}
                  onPress={() => handleCheckboxPress(id)}
                >
                  <Text appearance="secondaryText" fontSize={14}>
                    {t(label)}
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollableWrapper>
          <View style={spacings.pt}>
            <Button
              testID="review-seed-phrase-btn"
              disabled={!allCheckboxesChecked}
              accessibilityRole="button"
              size="large"
              text={t('Create recovery phrase')}
              hasBottomSpacing={false}
              onPress={handleSubmit}
            />
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(CreateSeedPhrasePrepareScreen)
