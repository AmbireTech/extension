import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

import getStyles from './styles'

const STAKING_APY_PROPOSAL_URL =
  'https://snapshot.org/#/s:ambire.eth/proposal/0xfc8edfdf451b2aa25575ea198019572de9dd0cdc1949d83e2176c75b62d6c913'
const STAKING_APY_TOOLTIP_ID = 'wallet-staking-apy-tooltip'

const WalletStakingApy = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()

  const handleOpenStakingApyProposal = useCallback(() => {
    openInTab({ url: STAKING_APY_PROPOSAL_URL }).catch((error) => {
      console.error('Failed to open the WALLET staking APY proposal', error)
      captureException(error)
      addToast(t("We couldn't open the DAO vote."), { type: 'error' })
    })
  }, [addToast, t])

  const stakingApyTooltipContent = useMemo(
    () => (
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap]}>
        <Text fontSize={14} appearance="secondaryText">
          {t('Currently')}{' '}
        </Text>
        <HoverablePressable onPress={handleOpenStakingApyProposal}>
          <Text fontSize={14} weight="medium" appearance="primary">
            {t('voted by the DAO')}
          </Text>
        </HoverablePressable>
        <Text fontSize={14} appearance="secondaryText">
          {' '}
          {t('as a fair staking incentive')}
        </Text>
      </View>
    ),
    [handleOpenStakingApyProposal, t]
  )

  return (
    <View style={styles.detailRow}>
      <Text fontSize={13} appearance="secondaryText">
        {t('APY')}
      </Text>
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Text fontSize={13} appearance="secondaryText">
          {t('2% (variable rate)')}
        </Text>
        <InfoIcon
          width={14}
          height={14}
          color={theme.secondaryText}
          data-tooltip-id={STAKING_APY_TOOLTIP_ID}
          style={spacings.mlTy}
        />
        <Tooltip id={STAKING_APY_TOOLTIP_ID} clickable>
          {stakingApyTooltipContent}
        </Tooltip>
      </View>
    </View>
  )
}

export default React.memo(WalletStakingApy)
