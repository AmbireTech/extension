import React, { useMemo } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import Badge from '@common/components/Badge'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary/sizeMultiplier'
import spacings from '@common/styles/spacings'

import { getFormattedSubmittedDate, getPresentationalStatus, isSpeedingUp } from './helpers'
import StatusBadge from './StatusBadge'
import getStyles from './styles'
import { SubmittedAccountOpLike } from './types'

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
  const { t } = useTranslation()
  const submittedDate = useMemo(
    () => getFormattedSubmittedDate(submittedAccountOp.timestamp),
    [submittedAccountOp.timestamp]
  )

  return (
    <View style={[styles.header, spacings.phSm]}>
      {isSpeedingUp(submittedAccountOp) ? (
        <Badge
          size="md"
          type="primaryAccent"
          weight="medium"
          text={t('Speeding up')}
          withRightSpacing
        />
      ) : (
        <StatusBadge status={getPresentationalStatus(submittedAccountOp)} textSize={12} />
      )}
      <View style={styles.headerMeta}>
        <Text
          fontSize={12}
          appearance="secondaryText"
          numberOfLines={1}
          style={styles.headerMetaText}
        >
          {submittedDate} on {network.name}
        </Text>
        <NetworkIcon
          id={submittedAccountOp.chainId.toString()}
          size={20 * sizeMultiplier[size]}
          style={{ ...spacings.mlMi, ...styles.networkIcon }}
        />
      </View>
    </View>
  )
}

export default React.memo(SummaryHeader)
