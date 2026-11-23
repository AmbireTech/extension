import React, { useCallback, useMemo } from 'react'

import HeaderButton from '@common/components/HeaderButton'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { getUiType } from '@common/utils/uiType'

const { isPopup, isTab, isRequestWindow } = getUiType()

export type DisplayIn = 'popup' | 'tab' | 'request-window' | 'always' | 'never'

const HeaderBackButton = ({
  displayIn = 'always',
  onGoBackPress,
  forceBack
}: {
  displayIn?: DisplayIn | DisplayIn[]
  onGoBackPress?: () => void
  forceBack?: boolean
}) => {
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
    <HeaderButton type="back" onPress={onGoBackPress || handleGoBack} testID="back-arrow-button" />
  )
}

export default HeaderBackButton
