import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import BurgerIcon from '@common/assets/svg/BurgerIcon'
import CloseIcon from '@common/assets/svg/CloseIcon'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Blockies from '@common/components/Blockies'
import CopyText from '@common/components/CopyText'
import NavIconWrapper from '@common/components/NavIconWrapper'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useAccounts from '@common/hooks/useAccounts'
import useHeaderBottomSheet from '@common/hooks/useHeaderBottomSheet'
import useNetwork from '@common/hooks/useNetwork'
import usePrivateMode from '@common/hooks/usePrivateMode'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { DrawerHeaderProps } from '@react-navigation/drawer'
import { getHeaderTitle } from '@react-navigation/elements'

import styles from './styles'

interface Props extends Partial<DrawerHeaderProps> {
  mode?: 'title' | 'bottom-sheet'
  withHamburger?: boolean
  withHeaderRight?: boolean
  options?: any
}

const Header: React.FC<Props> = ({
  mode = 'bottom-sheet',
  withHamburger = false,
  withHeaderRight = false,
  navigation,
  route,
  options
}) => {
  const insets = useSafeAreaInsets()
  const canGoBack = navigation.canGoBack()
  const title = getHeaderTitle(options, route.name)
  const { network } = useNetwork()
  const { selectedAcc } = useAccounts()
  const { openHeaderAccountsBottomSheet, openHeaderNetworksBottomSheet } = useHeaderBottomSheet()
  const { hidePrivateValue } = usePrivateMode()

  const renderBottomSheetSwitcher = (
    <View style={[flexboxStyles.directionRow, flexboxStyles.flex1]}>
      <TouchableOpacity style={styles.switcherContainer} onPress={openHeaderAccountsBottomSheet}>
        <Blockies borderRadius={13} size={6} seed={selectedAcc} />

        <View style={[flexboxStyles.flex1, spacings.mhTy]}>
          <Text fontSize={14} weight="regular" numberOfLines={1} ellipsizeMode="middle">
            {hidePrivateValue(selectedAcc)}
          </Text>
        </View>

        <CopyText text={selectedAcc} width={22} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.switcherContainer} onPress={openHeaderNetworksBottomSheet}>
        <View style={styles.headerNetworkIcon}>
          <NetworkIcon name={network?.id} width={24} height={24} />
        </View>

        <View style={[flexboxStyles.flex1, spacings.mhTy]}>
          <Text weight="regular" fontSize={14} numberOfLines={1}>
            {network?.name}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )

  const renderHeaderLeft = () => {
    if (options.hideHeaderLeft) return <></>

    if (typeof options.headerLeft === 'function') {
      return options.headerLeft({})
    }

    if (withHamburger) {
      return (
        <NavIconWrapper onPress={navigation.openDrawer}>
          <BurgerIcon />
        </NavIconWrapper>
      )
    }

    if (canGoBack) {
      return (
        <NavIconWrapper onPress={navigation.goBack}>
          <LeftArrowIcon withRect={mode !== 'bottom-sheet'} />
        </NavIconWrapper>
      )
    }
    return null
  }

  const renderHeaderRight = () => {
    if (!withHeaderRight && !options.withHeaderRight) return <></>

    return (
      <TouchableOpacity
        onPress={options.onRightHeaderPress ? options.onRightHeaderPress : () => {}}
        style={styles.closeIcon}
      >
        <CloseIcon color={colors.pink} />
      </TouchableOpacity>
    )
  }

  // On the left and on the right side, there is always reserved space
  // for the nav bar buttons. And so that in case a title is present,
  // it is centered always in the logical horizontal middle.
  const navIconContainer =
    mode === 'bottom-sheet' ? styles.navIconContainerSmall : styles.navIconContainerRegular

  // The header should start a little bit below the end of the notch
  const notchInset = insets.top + 5

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
          paddingTop: notchInset
        }
      ]}
    >
      <View style={[styles.wrapper]}>
        <View style={navIconContainer}>{renderHeaderLeft()}</View>

        {mode === 'bottom-sheet' && renderBottomSheetSwitcher}
        {mode === 'title' && (
          <Text fontSize={18} weight="regular" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}

        {mode === 'title' && <View style={navIconContainer}>{renderHeaderRight()}</View>}
      </View>
    </View>
  )
}

export default React.memo(Header)
