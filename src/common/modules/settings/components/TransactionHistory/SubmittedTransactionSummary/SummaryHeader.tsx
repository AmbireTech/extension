import React, { useMemo } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary/sizeMultiplier'
import spacings from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

import {
  getFormattedSubmittedDate,
  getPresentationalStatus,
  getTruncatedNetworkName
} from './helpers'
import StatusBadge from './StatusBadge'
import getStyles from './styles'
import { SubmittedAccountOpLike } from './types'

const { isSidePanel } = getUiType()

const SummaryHeader = ({
  submittedAccountOp,
  network,
  size
}: {
  submittedAccountOp: SubmittedAccountOpLike
  network: Network
  size: 'sm' | 'md' | 'lg'
}) => {
  const { styles } = useTheme(getStyles)
  const submittedDate = useMemo(
    () => getFormattedSubmittedDate(submittedAccountOp.timestamp),
    [submittedAccountOp.timestamp]
  )
  const networkName = isSidePanel
    ? getTruncatedNetworkName(network.name, 10)
    : getTruncatedNetworkName(network.name)

  return (
    <View style={[styles.header, spacings.phSm]}>
      <StatusBadge status={getPresentationalStatus(submittedAccountOp)} textSize={12} />
      <View style={styles.headerMeta}>
        <Text fontSize={12} appearance="secondaryText">
          {submittedDate} on {networkName}
        </Text>
        <NetworkIcon
          id={submittedAccountOp.chainId.toString()}
          size={20 * sizeMultiplier[size]}
          style={spacings.mlMi}
        />
      </View>
    </View>
  )
}

export default React.memo(SummaryHeader)
