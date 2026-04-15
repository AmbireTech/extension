import React, { createContext, Fragment, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Outlet } from 'react-router-dom'

import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_2XL, SPACING_4XL } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import Sidebar from '@web/modules/settings/components/Sidebar'

import getStyles from './styles'

interface SettingsRoutesContextReturnProps {
  setCurrentSettingsPage: React.Dispatch<React.SetStateAction<string | undefined>>
  currentSettingsPage?: string
}

const SettingsRoutesContext = createContext<SettingsRoutesContextReturnProps>({
  setCurrentSettingsPage: () => {},
  currentSettingsPage: undefined
})

const SettingsRoutesProvider = () => {
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const isScreenXxl = maxWidthSize('xxl')
  const isScreenXl = maxWidthSize('xl')
  const { pathname } = useRoute()
  const [currentSettingsPage, setCurrentSettingsPage] = useState<string | undefined>()

  const withScrollView = useMemo(() => {
    return !(
      pathname?.includes(ROUTES.signedMessages) ||
      pathname?.includes(ROUTES.transactions) ||
      pathname?.includes(ROUTES.addressBook) ||
      pathname?.includes(ROUTES.approvals) ||
      pathname?.includes(ROUTES.recoveryPhrasesSettings) ||
      pathname?.includes(ROUTES.accountsSettings) ||
      pathname?.includes(ROUTES.networksSettings) ||
      pathname?.includes(ROUTES.manageTokens)
    )
  }, [pathname])

  const leftMargin = useMemo(() => {
    if (isScreenXxl) return 120
    if (isScreenXl) return SPACING_4XL

    return SPACING_2XL
  }, [isScreenXl, isScreenXxl])

  const Wrapper = withScrollView ? ScrollView : Fragment

  return (
    <SettingsRoutesContext.Provider
      value={useMemo(
        () => ({
          setCurrentSettingsPage,
          currentSettingsPage
        }),
        [currentSettingsPage]
      )}
    >
      <View style={styles.background}>
        <View style={[styles.container, !isScreenXl ? common.fullWidth : {}]}>
          <Sidebar activeLink={currentSettingsPage} />
          <View style={{ ...styles.contentContainer, marginLeft: leftMargin }}>
            <View
              style={[
                styles.panel,
                !isScreenXl ? common.fullWidth : {},
                withScrollView ? { ...spacings.ph0, ...spacings.pv0 } : {}
              ]}
            >
              <Wrapper>
                <Outlet />
              </Wrapper>
            </View>
          </View>
          {isScreenXxl ? (
            <View style={styles.sideContainer}>
              <Sidebar activeLink={currentSettingsPage} />
            </View>
          ) : null}
        </View>
      </View>
    </SettingsRoutesContext.Provider>
  )
}

export { SettingsRoutesProvider, SettingsRoutesContext }
