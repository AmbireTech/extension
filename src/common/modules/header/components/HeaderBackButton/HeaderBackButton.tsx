import React, { useCallback, useMemo } from 'react'
import { ColorValue, Pressable } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isPopup, isTab, isRequestWindow } = getUiType()

export type DisplayIn = 'popup' | 'tab' | 'request-window' | 'always' | 'never'

const HeaderBackButton = ({
  displayIn = 'always',
  onGoBackPress,
  forceBack,
  color
}: {
  displayIn?: DisplayIn | DisplayIn[]
  onGoBackPress?: () => void
  forceBack?: boolean
  color?: string | ColorValue
}) => {
  const { theme } = useTheme()
  const { path, params } = useRoute()
  const { navigate } = useNavigation()

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
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifyCenter,
        {
          width: 28,
          height: 28
        }
      ]}
      onPress={onGoBackPress || handleGoBack}
    >
      {({ hovered }: any) => (
        <>
          <LeftArrowIcon color={color || (hovered ? theme.primaryText : theme.iconPrimary)} />
        </>
      )}
    </Pressable>
  )
}

export default HeaderBackButton
