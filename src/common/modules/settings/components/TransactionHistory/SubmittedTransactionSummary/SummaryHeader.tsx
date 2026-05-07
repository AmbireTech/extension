import React, { useMemo } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary'

import {
  getFormattedSubmittedDate,
  getPresentationalStatus,
  getTruncatedNetworkName
} from './helpers'
import StatusBadge from './StatusBadge'
import getStyles from './styles'

const SummaryHeader = ({
  submittedAccountOp,
  network,
  size
}: {
  submittedAccountOp: SubmittedAccountOp
  network: Network
  size: 'sm' | 'md' | 'lg'
}) => {
  const { styles } = useTheme(getStyles)
  const submittedDate = useMemo(
    () => getFormattedSubmittedDate(submittedAccountOp.timestamp),
    [submittedAccountOp.timestamp]
  )

  return (
    <View style={[styles.header, spacings.phSm]}>
      <StatusBadge
        status={getPresentationalStatus(submittedAccountOp)}
        textSize={14 * sizeMultiplier[size]}
      />
      <View style={styles.headerMeta}>
        <Text fontSize={14 * sizeMultiplier[size]} appearance="secondaryText">
          {submittedDate} on {getTruncatedNetworkName(network.name)}
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
