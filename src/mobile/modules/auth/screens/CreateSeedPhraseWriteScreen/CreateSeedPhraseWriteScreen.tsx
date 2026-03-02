import React from 'react'
import { ScrollView, View } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import Button from '@common/components/Button'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useCreateSeedWrite from '@common/modules/auth/hooks/useCreateSeedWrite'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const CreateSeedPhraseWriteScreen = () => {
  const { handleSubmit, handleCopyToClipboard, seedArray } = useCreateSeedWrite()
  const { goToPrevRoute } = useOnboardingNavigation()
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title="Back up recovery phrase"
        step={1}
        totalSteps={2}
      >
        {!!seedArray.length && (
          <>
            <Text weight="medium" appearance="secondaryText" style={spacings.mbMd}>
              {t('Write down and secure the recovery phrase for your account.')}
            </Text>

            <View style={flexbox.flex1}>
              <View
                style={{
                  ...flexbox.directionRow,
                  ...flexbox.justifyCenter,
                  ...flexbox.wrap,
                  borderWidth: 1,
                  borderColor: theme.neutral600,
                  ...common.borderRadiusPrimary,
                  ...spacings.mbTy
                }}
              >
                {seedArray.map((word, index) => (
                  <View
                    key={`${word}-${index.toString()}`}
                    style={{
                      width: '33.33%',
                      borderRightWidth: (index + 1) % 3 === 0 ? 0 : 1,
                      borderBottomWidth: index < 9 ? 1 : 0,
                      borderColor: theme.neutral600,
                      ...spacings.pvMi,
                      ...spacings.phTy,
                      ...flexbox.alignCenter,
                      ...flexbox.justifyCenter
                    }}
                  >
                    <View style={[flexbox.directionRow, flexbox.alignCenter, { width: '100%' }]}>
                      <Text
                        fontSize={12}
                        appearance="tertiaryText"
                        weight="medium"
                        style={{ lineHeight: 13 }}
                      >
                        {index + 1}.
                      </Text>
                    </View>
                    <Text fontSize={14} weight="medium" style={{ lineHeight: 19 }}>
                      {word}
                    </Text>
                    <Text fontSize={12} style={{ lineHeight: 11 }}>
                      {' '}
                    </Text>
                  </View>
                ))}
              </View>

              <View
                style={[
                  flexbox.directionRow,
                  flexbox.justifyCenter,
                  spacings.ptTy,
                  common.borderRadiusPrimary,
                  spacings.mbXl
                ]}
              >
                <Button
                  type="tertiary"
                  text={t('Copy recovery phrase')}
                  hasBottomSpacing={false}
                  size="small"
                  testID="copy-recovery-phrase"
                  onPress={handleCopyToClipboard}
                >
                  <CopyIcon style={spacings.mlTy} color={theme.iconPrimary} />
                </Button>
              </View>
            </View>
            <Button
              testID="create-seed-phrase-write-continue-btn"
              accessibilityRole="button"
              text={t("I've saved the phrase")}
              size="large"
              hasBottomSpacing={false}
              onPress={handleSubmit}
            />
          </>
        )}
        {!seedArray.length && (
          <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
            <Spinner style={{ width: 16, height: 16 }} />
          </View>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default CreateSeedPhraseWriteScreen
