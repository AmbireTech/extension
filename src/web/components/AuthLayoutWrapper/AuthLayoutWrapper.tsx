import { LinearGradient } from 'expo-linear-gradient'
import React, { createContext, useContext } from 'react'
import { View, ViewProps } from 'react-native'
import { Outlet } from 'react-router-dom'

import Wrapper from '@common/components/Wrapper'
import colors from '@common/styles/colors'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import Ameba from '@web/components/AuthLayoutWrapper/Ameba'
import TabHeader from '@web/modules/router/components/TabHeader'

import styles from './styles'

const AuthLayoutWrapperContext = createContext(true)

const AuthLayoutWrapper = (
  <AuthLayoutWrapperContext.Provider value={true}>
    <View style={[flexbox.directionRow, flexbox.flex1]}>
      <Outlet />
    </View>
  </AuthLayoutWrapperContext.Provider>
)

export const AuthLayoutWrapperMainContent: React.FC<any> = ({ children }) => {
  const context = useContext(AuthLayoutWrapperContext)

  if (!context) {
    throw new Error('Should be used in AuthLayoutWrapper component!')
  }

  return (
    <View style={[flexbox.flex1, { backgroundColor: colors.zircon }]}>
      <TabHeader />
      <View style={[flexbox.flex1, flexbox.justifyCenter]}>
        <View
          style={[
            spacings.pbLg,
            spacings.phLg,
            flexbox.alignSelfCenter,
            { width: 770 + SPACING_LG * 2, minHeight: 600 }
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  )
}

interface AuthLayoutWrapperSideContentProps extends ViewProps {
  backgroundType?: 'alpha' | 'beta'
}

export const AuthLayoutWrapperSideContent: React.FC<AuthLayoutWrapperSideContentProps> = ({
  backgroundType = 'alpha',
  children,
  style,
  ...rest
}) => {
  const context = useContext(AuthLayoutWrapperContext)

  if (!context) {
    throw new Error('Should be used in AuthLayoutWrapper component!')
  }

  return (
    <LinearGradient
      colors={['#ae60ff', '#28e7a7']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.sideContentContainer, style]}
      {...rest}
    >
      <Wrapper contentContainerStyle={[spacings.ph0, { flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
        {children}
      </Wrapper>
      <Ameba style={backgroundType === 'alpha' ? styles.amebaAlpha : styles.amebaBeta} />
    </LinearGradient>
  )
}

export default AuthLayoutWrapper
