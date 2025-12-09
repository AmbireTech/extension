import React, { useCallback, useMemo } from 'react'
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

const { isPopup, isTab, isRequestWindow } = getUiType()

export type DisplayIn = 'popup' | 'tab' | 'request-window' | 'always' | 'never'

const HeaderBackButton = ({
  displayIn = 'popup',
  onGoBackPress,
  forceBack
}: {
  displayIn?: DisplayIn | DisplayIn[]
  onGoBackPress?: () => void
  forceBack?: boolean
}) => {
  const { theme } = useTheme()
  const { path, params } = useRoute()
  const { navigate } = useNavigation()
  const { t } = useTranslation()

  const navigationEnabled = !isRequestWindow

  const canGoBack =
    !!params?.prevRoute?.key &&
    params?.prevRoute?.pathname !== '/' &&
    path !== '/get-started' &&
    navigationEnabled

  const shouldBeDisplayed = useMemo(() => {
    if (displayIn.includes('always')) return true
    if (displayIn.includes('never')) return false

    const displayInArray = Array.isArray(displayIn) ? displayIn : [displayIn]

    return displayInArray.some((display) => {
      if (display === 'popup') return isPopup
      if (display === 'request-window') return isRequestWindow

      return isTab
    })
  }, [displayIn])

  const handleGoBack = useCallback(() => navigate(params?.backTo || -1), [navigate, params])

  if (!shouldBeDisplayed || (!canGoBack && !forceBack)) return null

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
