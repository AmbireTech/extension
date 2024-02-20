import React, { useCallback } from 'react'
import { Pressable } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@web/utils/uiType'

const { isPopup, isNotification } = getUiType()

const HeaderBackButton = ({
  hideInPopup = false,
  onGoBackPress,
  forceBack
}: {
  hideInPopup?: boolean
  onGoBackPress?: () => void
  forceBack?: boolean
}) => {
  const { theme } = useTheme()
  const { path, params } = useRoute()
  const { navigate } = useNavigation()
  const { t } = useTranslation()

  const showBackButtonInPopup = isPopup && !hideInPopup
  const navigationEnabled = !isNotification

  const canGoBack =
    !!params?.prevRoute?.key &&
    params?.prevRoute?.pathname !== '/' &&
    path !== '/get-started' &&
    navigationEnabled

  const handleGoBack = useCallback(() => navigate(params?.backTo || -1), [navigate, params])

  if (!showBackButtonInPopup || (!canGoBack && !forceBack)) return null

  return (
    <Pressable
      style={[flexbox.directionRow, flexbox.alignCenter]}
      onPress={onGoBackPress || handleGoBack}
    >
      {({ hovered }: any) => (
        <>
          <LeftArrowIcon color={theme[hovered ? 'primaryText' : 'secondaryText']} />
          <Text
            style={spacings.plTy}
            fontSize={16}
            weight="medium"
            appearance={hovered ? 'primaryText' : 'secondaryText'}
          >
            {t('Back')}
          </Text>
        </>
      )}
    </Pressable>
  )
}

export default HeaderBackButton
