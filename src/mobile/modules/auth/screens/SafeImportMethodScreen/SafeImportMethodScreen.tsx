import React, { useMemo } from 'react'
import { View } from 'react-native'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import SafeIcon from '@common/assets/svg/SafeIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const SafeImportMethodScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const methods = useMemo(
    () => [
      {
        title: 'Import Safe address',
        icon: SafeIcon,
        onPress: () => goToNextRoute(ROUTES.safeImportAddress)
      },
      {
        title: 'Import by owner',
        icon: SingleKeyIcon,
        onPress: () => goToNextRoute(ROUTES.safeImportByOwner)
      }
    ],
    [goToNextRoute]
  )

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Import Safe account')}
      >
        <View>
          {methods.map(({ title, icon: Icon, onPress }) => (
            <Button
              key={title}
              type="tertiary"
              onPress={onPress}
              testID={`safe-import-method-${title.toLocaleLowerCase().split(' ').join('-')}`}
              childrenContainerStyle={{
                ...flexbox.directionRow,
                ...flexbox.alignCenter,
                ...flexbox.justifySpaceBetween,
                ...flexbox.flex1
              }}
            >
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <Icon width={24} height={24} color={theme.iconPrimary} />
                <Text style={spacings.mlSm} fontSize={16} weight="medium">
                  {t(title)}
                </Text>
              </View>
              <RightArrowIcon color={theme.iconPrimary} />
            </Button>
          ))}
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(SafeImportMethodScreen)
