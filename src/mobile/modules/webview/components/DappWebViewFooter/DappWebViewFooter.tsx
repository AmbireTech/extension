import React from 'react'
import { Control } from 'react-hook-form'
import { Pressable, View, ViewStyle } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Dapp } from '@ambire-common/interfaces/dapp'
import HomeIcon from '@common/assets/svg/HomeIcon'
import Avatar from '@common/components/Avatar'
import NetworkIcon from '@common/components/NetworkIcon'
import Search from '@common/components/Search'
import { AnimatedPressable } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import NotConnected from '@common/modules/dapp-catalog/components/DappIcon/NotConnected'
import ManageApp from '@common/modules/dapp-catalog/components/ManageApp'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  headerControl: Control<any>
  animStyle: ViewStyle
  bindAnim: {
    onHoverIn?: (event: any) => void
    onHoverOut?: (event: any) => void
    onPressIn?: (event: any) => void
    onPressOut?: (event: any) => void
  }
  handleOpenSearchModal: () => void
  account: Account | null
  currentDapp: Dapp | null | undefined
  smartAccountType?: 'Ambire' | 'Safe'
}

const DappWebViewFooter: React.FC<Props> = ({
  headerControl,
  animStyle,
  bindAnim,
  handleOpenSearchModal,
  account,
  currentDapp,
  smartAccountType
}) => {
  const { theme } = useTheme()
  const { navigate } = useNavigation()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phSm,
        spacings.ptSm,
        spacings.pbTy
      ]}
    >
      <Pressable
        onPress={() => navigate(ROUTES.apps)}
        style={[
          flexbox.alignCenter,
          flexbox.justifyCenter,
          {
            backgroundColor: theme.secondaryBackground,
            borderRadius: 50,
            width: 40,
            height: 40
          }
        ]}
      >
        <HomeIcon />
      </Pressable>
      <AnimatedPressable
        style={[
          flexbox.flex1,
          spacings.mhSm,
          { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_PRIMARY },
          animStyle
        ]}
        onPress={handleOpenSearchModal}
        {...bindAnim}
      >
        <View pointerEvents="none">
          <Search
            control={headerControl as any}
            hasLeftIcon={false}
            inputWrapperStyle={{
              backgroundColor: 'transparent'
            }}
            withClearButton={false}
            editable={false}
          />
        </View>
      </AnimatedPressable>
      {!!account && (
        <View>
          {!!currentDapp && (
            <>
              <View
                style={{
                  borderRadius: 10,
                  backgroundColor:
                    currentDapp.blacklisted === 'BLACKLISTED'
                      ? theme.errorDecorative
                      : theme.successDecorative,
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  zIndex: 2,
                  borderWidth: 1,
                  borderColor:
                    currentDapp.blacklisted === 'BLACKLISTED'
                      ? theme.errorBackground
                      : theme.primaryBackground
                }}
              >
                {!currentDapp.isConnected && (
                  <NotConnected
                    width={12}
                    height={12}
                    isBlacklisted={currentDapp.blacklisted === 'BLACKLISTED'}
                  />
                )}
              </View>

              {currentDapp.isConnected && (
                <View
                  style={{
                    position: 'absolute',
                    left: -2,
                    bottom: -2,
                    zIndex: 2
                  }}
                >
                  <NetworkIcon id={currentDapp.chainId.toString()} size={12} scale={0.8} />
                </View>
              )}
            </>
          )}
          {!!currentDapp && (
            <ManageApp dapp={currentDapp} withCurrentAccount>
              <Avatar
                pfp={account.preferences.pfp}
                address={account.addr}
                size={40}
                style={spacings.pr0}
                smartAccountType={smartAccountType}
              />
            </ManageApp>
          )}
        </View>
      )}
    </View>
  )
}

export default React.memo(DappWebViewFooter)
