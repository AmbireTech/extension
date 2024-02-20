import React, { FC, Fragment } from 'react'
import { ScrollView, View } from 'react-native'

import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import Panel from '@common/components/Panel'
import { getPanelPaddings } from '@common/components/Panel/Panel'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'

import Sidebar from './Sidebar'
import getStyles from './styles'

interface Props {
  children: React.ReactElement | React.ReactElement[]
  currentPage: string
  withPanelScrollView?: boolean
}

const SettingsPage: FC<Props> = ({ children, currentPage, withPanelScrollView = true }) => {
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const isScreenXxl = maxWidthSize('xxl')
  const isScreenXl = maxWidthSize('xl')
  const panelPaddings = getPanelPaddings(maxWidthSize, false)
  const wrapperProps = withPanelScrollView ? { contentContainerStyle: panelPaddings } : {}
  const Wrapper = withPanelScrollView ? ScrollView : Fragment

  return (
    <View style={styles.background}>
      <View style={[styles.container, !isScreenXl ? common.fullWidth : {}]}>
        <Sidebar activeLink={currentPage} />
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <AmbireLogoHorizontal />
          </View>
          <Panel
            style={[
              styles.panel,
              !isScreenXl ? common.fullWidth : {},
              withPanelScrollView ? { ...spacings.ph0, ...spacings.pv0 } : {}
            ]}
          >
            <Wrapper {...wrapperProps}>{children}</Wrapper>
          </Panel>
        </View>
        {isScreenXxl ? (
          <View style={styles.sideContainer}>
            <Sidebar activeLink={currentPage} />
          </View>
        ) : null}
      </View>
    </View>
  )
}

export default SettingsPage
