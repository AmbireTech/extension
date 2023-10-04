import React, { useCallback, useEffect, useState } from 'react'
import { ColorValue, TouchableOpacity, View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Blockies from '@common/components/Blockies'
import CopyText from '@common/components/CopyText'
import NavIconWrapper from '@common/components/NavIconWrapper'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useAccounts from '@common/hooks/useAccounts'
import useHeaderBottomSheet from '@common/hooks/useHeaderBottomSheet'
import useNavigation, { titleChangeEventStream } from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import usePrivateMode from '@common/hooks/usePrivateMode'
import useRoute from '@common/hooks/useRoute'
import routesConfig from '@common/modules/router/config/routesConfig'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { isExtension } from '@web/constants/browserapi'
import { getUiType } from '@web/utils/uiType'

import styles from './styles'

interface Props {
  mode?: 'title' | 'bottom-sheet'
  withHamburger?: boolean
  backgroundColor?: ColorValue
  withHeaderRight?: boolean
}

const Header: React.FC<Props> = ({
  mode = 'bottom-sheet',
  withHamburger = false,
  withHeaderRight = false,
  backgroundColor
}) => {
  const { network } = useNetwork()
  const { path, params } = useRoute()
  const { selectedAcc } = useAccounts()
  const { navigate } = useNavigation()
  const { openHeaderBottomSheet } = useHeaderBottomSheet()
  const { hidePrivateValue } = usePrivateMode()
  const [title, setTitle] = useState('')

  const handleGoBack = useCallback(() => navigate(-1), [navigate])
  const handleGoMenu = useCallback(() => navigate(ROUTES.menu), [navigate])

  const navigationEnabled = !getUiType().isNotification
  let canGoBack =
    // If you have a location key that means you routed in-app. But if you
    // don't that means you come from outside of the app or you just open it.
    params?.prevRoute?.key !== 'default' && params?.prevRoute?.pathname !== '/' && navigationEnabled

  if (isExtension && getUiType().isTab) {
    canGoBack = true
  }

  useEffect(() => {
    if (!path) return

    const nextRoute = path?.substring(1)
    setTitle(routesConfig[nextRoute]?.title || '')
  }, [path])

  useEffect(() => {
    const subscription = titleChangeEventStream!.subscribe({
      next: (v) => setTitle(v)
    })

    return () => subscription.unsubscribe()
  }, [])

  const renderBottomSheetSwitcher = (
    <TouchableOpacity
      style={[flexboxStyles.flex1, flexboxStyles.alignCenter]}
      onPress={openHeaderBottomSheet}
    >
      <Text weight="regular" fontSize={16}>
        {network?.name}
      </Text>
      <View
        style={[
          flexboxStyles.flex1,
          flexboxStyles.directionRow,
          spacings.phLg,
          flexboxStyles.alignCenter
        ]}
      >
        <Text
          color={colors.baileyBells}
          fontSize={12}
          numberOfLines={1}
          ellipsizeMode="middle"
          style={[spacings.prTy, { lineHeight: 12 }]}
        >
          {hidePrivateValue(selectedAcc)}
        </Text>
        <CopyText text={selectedAcc} />
      </View>
    </TouchableOpacity>
  )

  const renderHeaderLeft = () => {
    if (canGoBack) {
      return (
        <NavIconWrapper onPress={handleGoBack}>
          <LeftArrowIcon />
        </NavIconWrapper>
      )
    }

    return null
  }

  const renderHeaderRight = (
    <NavIconWrapper onPress={handleGoMenu}>
      <Blockies borderRadius={13} size={10} seed={selectedAcc} />
    </NavIconWrapper>
  )

  // On the left and on the right side, there is always reserved space
  // for the nav bar buttons. And so that in case a title is present,
  // it is centered always in the logical horizontal middle.
  const navIconContainer =
    mode === 'bottom-sheet' ? styles.navIconContainerSmall : styles.navIconContainerRegular

  // Using the `<Header />` from the '@react-navigation/elements' created
  // many complications in terms of styling the UI, calculating the header
  // height and the spacings between the `headerLeftContainerStyle` and the
  // `headerRightContainerStyle`. The calculations never match.
  // Probably due to the fact the box model of the `<Header />` behaves
  // in different manner. And styling it was hell. So instead - implement
  // custom components that fully match the design we follow.
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: SPACING_SM,
          backgroundColor: backgroundColor || colors.wooed
        }
      ]}
    >
      <View style={navIconContainer}>
        {!withHamburger && renderHeaderLeft()}
        {!!withHamburger && (
          <NavIconWrapper onPress={openHeaderBottomSheet}>
            <NetworkIcon name={network?.id} style={styles.networkIcon} />
          </NavIconWrapper>
        )}
      </View>
      {mode === 'bottom-sheet' && renderBottomSheetSwitcher}
      {mode === 'title' && (
        <Text fontSize={18} weight="regular" style={styles.title} numberOfLines={2}>
          {title || ''}
        </Text>
      )}
      <View style={navIconContainer}>
        {(!!withHamburger || !!withHeaderRight) && renderHeaderRight}
      </View>
    </View>
  )
}

export default React.memo(Header)
