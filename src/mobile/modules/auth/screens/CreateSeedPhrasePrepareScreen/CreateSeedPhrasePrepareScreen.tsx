import React from 'react'
import { Pressable, View } from 'react-native'

import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
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
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const CreateSeedPhrasePrepareScreen = () => {
  const { handleSubmit, handleCheckboxPress, checkboxesState, allCheckboxesChecked, CHECKBOXES } =
    useCreateSeedPrepare()
  const { goToPrevRoute } = useOnboardingNavigation()
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        step={1}
        totalSteps={2}
        title="Create new recovery phrase"
        contentContainerStyle={flexbox.justifyStart}
      >
        <Text weight="medium" appearance="secondaryText" style={[spacings.mbXl, text.center]}>
          {t('Before you begin, check these security tips.')}
        </Text>
        <View style={flexbox.flex1}>
          {CHECKBOXES.map(({ id, label }, index) => (
            <View
              key={id}
              style={[
                spacings.pvSm,
                spacings.phSm,
                flexbox.directionRow,
                flexbox.alignStart,
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
              >
                <Pressable
                  testID={`create-seed-prepare-checkbox-${index}`}
                  onPress={() => handleCheckboxPress(id)}
                >
                  <Text appearance="secondaryText" fontSize={14}>
                    {t(label)}
                  </Text>
                </Pressable>
              </Checkbox>
            </View>
          ))}
        </View>
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
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(CreateSeedPhrasePrepareScreen)
