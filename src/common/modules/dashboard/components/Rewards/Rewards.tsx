import {
  MultiplierBadge,
  multiplierBadges,
  MULTIPLIERS_READ_MORE_URL
} from 'ambire-common/src/constants/multiplierBadges'
import useClaimableWalletToken from 'ambire-common/src/hooks/useClaimableWalletToken'
import useRewards from 'ambire-common/src/hooks/useRewards'
import { RewardIds } from 'ambire-common/src/hooks/useRewards/types'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import React, { useCallback, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import RewardBadgeBetaTester from '@common/assets/svg/RewardBadgeBetaTester'
import RewardBadgeCryptoTesters from '@common/assets/svg/RewardBadgeCryptoTesters'
import RewardBadgeLobster from '@common/assets/svg/RewardBadgeLobster'
import RewardBadgePowerUser from '@common/assets/svg/RewardBadgePowerUser'
import RewardsFlag from '@common/assets/svg/RewardFlag/RewardFlag'
import RewardsIcon from '@common/assets/svg/RewardsIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import usePrivateMode from '@common/hooks/usePrivateMode'
import useRelayerData from '@common/hooks/useRelayerData'
import useRequests from '@common/hooks/useRequests'
import getRewardsSource from '@common/modules/dashboard/helpers/getRewardsSource'
import alert from '@common/services/alert'
import { triggerLayoutAnimation } from '@common/services/layoutAnimation'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

const source = getRewardsSource()

const Rewards = () => {
  const { t } = useTranslation()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { selectedAcc } = useAccounts()
  const { network } = useNetwork()
  const { addRequest } = useRequests()
  const {
    rewards,
    lastUpdated: rewardsLastUpdated,
    isLoading: rewardsIsLoading,
    errMsg: rewardsErrMsg
  } = useRewards({
    relayerURL: CONFIG.RELAYER_URL,
    accountId: selectedAcc,
    useRelayerData,
    source
  })
  const { walletTokenAPYPercentage, walletUsdPrice, multipliers, totalLifetimeRewards } = rewards
  const {
    currentClaimStatus,
    claimableNow,
    disabledReason,
    claimDisabledReason,
    claimEarlyRewards,
    claimVesting,
    pendingTokensTotal,
    claimableNowUsd,
    mintableVestingUsd,
    shouldDisplayMintableVesting,
    claimingDisabled
  } = useClaimableWalletToken({
    relayerURL: CONFIG.RELAYER_URL,
    useRelayerData,
    accountId: selectedAcc,
    network,
    addRequest,
    totalLifetimeRewards,
    walletUsdPrice,
    rewardsLastUpdated,
    source
  })
  const { hidePrivateValue } = usePrivateMode()

  useLayoutEffect(() => {
    // Solves 2 issues: 1) the annoying jump in the beginning between the
    // loading and the loaded state; 2) the annoying jump when value updates.
    triggerLayoutAnimation()
  }, [pendingTokensTotal])

  const handleClaimWithBurn = () => {
    const handleConfirm = () => {
      closeBottomSheet()
      claimEarlyRewards(false)
    }

    alert(
      t('Are you sure?'),
      t(
        'This procedure will claim only 50% of your outstanding rewards as $WALLET, and permanently burn the rest. Are you sure?'
      ),
      [
        {
          text: t('Yes, claim anyway'),
          onPress: handleConfirm,
          style: 'destructive'
        },
        {
          text: t('Cancel'),
          style: 'cancel'
        }
      ]
    )
  }

  const renderRewardsButtonText = useCallback(() => {
    // The rewards value depends on both - the currentClaimStatus and the
    // rewards data. Therefore - require both data sets to be loaded.
    const hasErrorAndNoPrevValues =
      (currentClaimStatus.error || rewardsErrMsg) &&
      (!currentClaimStatus.lastUpdated || !rewardsLastUpdated)
    if (hasErrorAndNoPrevValues) {
      return t('...')
    }

    // Display loading state only if prev data is missing for any of both data sets.
    // For all other cases - display the prev data instead of loading indicator,
    // so that the UI doesn't jump by switching loading indicator on and off.
    const isCurrentClaimStatusLoadingAndNoPrevData =
      currentClaimStatus.loading && !currentClaimStatus.lastUpdated
    const isRewardsDataLoadingAndNoPrevData = rewardsIsLoading && !rewardsLastUpdated
    if (isCurrentClaimStatusLoadingAndNoPrevData || isRewardsDataLoadingAndNoPrevData) {
      return '...'
    }

    return t('{{amount}} $WALLET', {
      amount: hidePrivateValue(formatFloatTokenAmount(Math.floor(pendingTokensTotal), true, 0))
    })
  }, [
    currentClaimStatus.error,
    currentClaimStatus.lastUpdated,
    currentClaimStatus.loading,
    hidePrivateValue,
    pendingTokensTotal,
    rewardsErrMsg,
    rewardsIsLoading,
    rewardsLastUpdated,
    t
  ])

  const handleClaimInxWallet = () => {
    closeBottomSheet()
    claimEarlyRewards()
  }

  const handleClaimVesting = () => {
    closeBottomSheet()
    claimVesting()
  }

  const handleReadMore = () => Linking.openURL(MULTIPLIERS_READ_MORE_URL).finally(closeBottomSheet)

  const renderBadge = ({ id, multiplier, icon, name, color, link }: MultiplierBadge) => {
    const isUnlocked = multipliers && multipliers.map(({ name }) => name).includes(id)
    const handleLinkOpen = () => Linking.openURL(link)

    return (
      <TouchableOpacity onPress={handleLinkOpen} key={name} style={!isUnlocked && { opacity: 0.3 }}>
        {id === 'beta-tester' && <RewardBadgeBetaTester />}
        {id === 'lobsters' && <RewardBadgeLobster />}
        {id === 'cryptoTesters' && <RewardBadgeCryptoTesters />}
        {id === 'powerUserMultiplier' && <RewardBadgePowerUser />}
        {/* <Text fontSize={16} weight="semiBold">
          x{multiplier}
        </Text> */}
        {/* <RewardsFlag color={color} style={styles.rewardFlag} /> */}
      </TouchableOpacity>
    )
  }

  return (
    <>
      <View style={styles.tokenButtonContainer}>
        <View style={styles.tokenButtonIconWrapper}>
          <RewardsIcon />
        </View>
        <View style={[flexboxStyles.flex1, flexboxStyles.justifyCenter]}>
          <Text fontSize={14} numberOfLines={1}>
            {t('Rewards')}
          </Text>
          <Text fontSize={12} style={textStyles.highlightPrimary}>
            {hidePrivateValue(renderRewardsButtonText())}
          </Text>
        </View>

        <View style={spacings.plSm}>
          <Button
            onPress={openBottomSheet}
            type="secondary"
            hasBottomSpacing={false}
            style={styles.rewardTokenButton}
            size="small"
            text={t('Open')}
          />
        </View>
      </View>
      <BottomSheet
        id="rewards"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        displayCancel={false}
      >
        <Title style={[textStyles.center, spacings.mtTy, spacings.mbTy]}>
          {t('WALLET token distribution')}
        </Title>
        <View style={[flexboxStyles.directionRow, flexboxStyles.justifyCenter, spacings.mbTy]}>
          {multiplierBadges.map(renderBadge)}
        </View>

        <Text type="caption" style={[spacings.mb, textStyles.center]}>
          <Text type="caption">
            {t(
              'You are receiving $WALLETs for holding funds on your Ambire wallet as an early user. '
            )}
          </Text>
          <Text onPress={handleReadMore} underline type="caption">
            {t('Read More')}
          </Text>
        </Text>

        <View style={styles.tableContainer}>
          <View style={[styles.tableRow, flexboxStyles.directionRow, styles.tableRowBorder]}>
            <View style={[spacings.prTy, flexboxStyles.flex1]}>
              <Text>{t('Early users Incentive total (Early users + ADX Staking bonus)')}</Text>
            </View>
            <View style={[spacings.plTy, styles.tableRowValue]}>
              <Text color={colors.turquoise} style={textStyles.right}>
                {formatFloatTokenAmount(Math.floor(rewards[RewardIds.BALANCE_REWARDS]), true, 0)}
              </Text>
              <Text type="small" style={textStyles.right}>
                {walletTokenAPYPercentage} APY
              </Text>
            </View>
          </View>
          <View style={[styles.tableRow, shouldDisplayMintableVesting && styles.tableRowBorder]}>
            <View style={[flexboxStyles.directionRow, spacings.mb]}>
              <View style={[spacings.prTy, flexboxStyles.flex1]}>
                <Text>{t('Claimable now')}</Text>
                {claimingDisabled && (
                  <Text type="caption" appearance="danger">
                    {claimDisabledReason || disabledReason}
                  </Text>
                )}
              </View>
              <View style={[spacings.plTy, styles.tableRowValue]}>
                <Text color={colors.turquoise} style={textStyles.right}>
                  {currentClaimStatus.loading
                    ? '...'
                    : formatFloatTokenAmount(Math.floor(claimableNow), true, 0)}
                </Text>
                <Text type="small" style={textStyles.right}>
                  <Text type="small" color={colors.heliotrope}>
                    $
                  </Text>
                  {currentClaimStatus.loading ? '...' : claimableNowUsd}
                </Text>
              </View>
            </View>
            <Button
              disabled={claimingDisabled}
              onPress={handleClaimWithBurn}
              text={t('Claim with Burn')}
              style={spacings.mbSm}
            />
            <Button
              disabled={claimingDisabled}
              onPress={handleClaimInxWallet}
              text={t('Claim in xWALLET')}
              style={shouldDisplayMintableVesting && spacings.mbMi}
            />
          </View>

          {shouldDisplayMintableVesting && (
            <View style={styles.tableRow}>
              <View style={[flexboxStyles.directionRow, spacings.mb]}>
                <View style={[spacings.prTy, flexboxStyles.flex1]}>
                  <Text>{t('Claimable early supporters vesting')}</Text>
                </View>
                <View style={[spacings.plTy, styles.tableRowValue]}>
                  <Text color={colors.turquoise} style={textStyles.right}>
                    {currentClaimStatus.mintableVesting}
                  </Text>
                  <Text type="small" style={textStyles.right}>
                    <Text type="small" color={colors.heliotrope}>
                      $
                    </Text>
                    {currentClaimStatus.loading ? '...' : mintableVestingUsd}
                  </Text>
                </View>
              </View>
              <Button
                onPress={handleClaimVesting}
                disabled={!!disabledReason}
                text={t('Claim')}
                hasBottomSpacing={false}
              />
            </View>
          )}
        </View>
      </BottomSheet>
    </>
  )
}

export default React.memo(Rewards)
