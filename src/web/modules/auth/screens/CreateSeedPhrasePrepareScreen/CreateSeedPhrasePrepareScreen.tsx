import React from 'react'
import { Pressable, View } from 'react-native'

import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Panel from '@common/components/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useCreateSeedPrepare from '@common/modules/auth/hooks/useCreateSeedPrepare'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const CreateSeedPhrasePrepareScreen = () => {
  const { handleSubmit, handleCheckboxPress, checkboxesState, allCheckboxesChecked, CHECKBOXES } =
    useCreateSeedPrepare()
  const { goToPrevRoute } = useOnboardingNavigation()
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
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
                  value={checkboxesState[id]!}
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
