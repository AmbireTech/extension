import React from 'react'
import { View } from 'react-native'

import LayoutWrapper from '@common/components/LayoutWrapper'
import useTheme from '@common/hooks/useTheme'
import TokensSkeleton from '@common/modules/dashboard/components/Tokens/TokensSkeleton'
import getDashboardStyles from '@common/modules/dashboard/screens/styles'
import spacings from '@common/styles/spacings'
import PrivacyPoolsOverview from '@web/modules/privacy-pools/components/PrivacyPoolsOverview'
import commonWebStyles from '@web/styles/utils/common'

const noop = () => {}

/**
 * Holds the place of `PrivacyPoolsDashboardScreen` until its controllers load. It renders the same
 * overview card, so the layout does not shift when the real dashboard replaces it.
 */
const PrivacyPoolsDashboardShell = () => {
  const { styles } = useTheme(getDashboardStyles)

  return (
    <LayoutWrapper>
      <View style={styles.container}>
        <PrivacyPoolsOverview
          hasSyncedAnyChain={false}
          isSyncing
          hasSyncError={false}
          totalPrivateBalance={0}
          canSend={false}
          onRefresh={noop}
          onSend={noop}
        />
        <View style={[commonWebStyles.contentContainer, spacings.phSm, { paddingRight: 16 }]}>
          <TokensSkeleton />
        </View>
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(PrivacyPoolsDashboardShell)
