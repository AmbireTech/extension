import React from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import BottomSheet from '@modules/common/components/BottomSheet'
import useBottomSheet from '@modules/common/components/BottomSheet/hooks/useBottomSheet'
import Button from '@modules/common/components/Button'
import { Row } from '@modules/common/components/Table'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'
import useRewards, { RewardIds } from '@modules/dashboard/hooks/useRewards'
import useStakedWalletToken from '@modules/dashboard/hooks/useStakedWalletToken'

import styles from './styles'

const BLOG_POST_URL = 'https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747'

const multiplierBadges = [
  {
    id: 'beta-tester',
    name: 'Beta Testers',
    icon: '🧪',
    color: '#6000FF',
    multiplier: 1.25,
    link: 'https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747'
  },
  {
    id: 'lobsters',
    name: 'Lobsters',
    icon: '🦞',
    color: '#E82949',
    multiplier: 1.5,
    link: 'https://blog.ambire.com/ambire-wallet-to-partner-with-lobsterdao-10b57e6da0-53c59c88726b'
  }
]

const Rewards = () => {
  const { t } = useTranslation()
  const { sheetRef, openBottomSheet, closeBottomSheet, isOpen } = useBottomSheet()
  const { rewards, pendingTokensTotal, claimableWalletToken, isLoading } = useRewards()
  const { stakedAmount } = useStakedWalletToken()

  const {
    vestingEntry,
    currentClaimStatus,
    claimableNow,
    disabledReason,
    claimDisabledReason,
    claimEarlyRewards,
    claimVesting
  } = claimableWalletToken

  const walletTokenAPY = rewards.walletTokenAPY ? (rewards.walletTokenAPY * 100).toFixed(2) : '...'
  const adxTokenAPY = rewards.adxTokenAPY ? (rewards.adxTokenAPY * 100).toFixed(2) : '...'
  const xWALLETAPY = rewards.xWALLETAPY ? (rewards.xWALLETAPY * 100).toFixed(2) : '...'
  const walletTokenUSDPrice = rewards.walletUsdPrice || 0

  const claimableNowUsd =
    walletTokenUSDPrice && !currentClaimStatus.loading && claimableNow
      ? (walletTokenUSDPrice * claimableNow).toFixed(2)
      : '...'
  const mintableVestingUsd =
    walletTokenUSDPrice && !currentClaimStatus.loading && currentClaimStatus.mintableVesting
      ? (walletTokenUSDPrice * currentClaimStatus.mintableVesting).toFixed(2)
      : '...'

  const handleReadMore = () => Linking.openURL(BLOG_POST_URL).finally(closeBottomSheet)

  const renderBadge = ({ id, multiplier, icon, name, color }) => {
    const isUnlocked =
      rewards.multipliers && rewards.multipliers.map(({ name }) => name).includes(id)

    return (
      <TouchableOpacity
        disabled={!isUnlocked}
        key={name}
        style={[
          flexboxStyles.center,
          spacings.mhMi,
          { width: 73.409, height: 84.533 },
          !isUnlocked && { opacity: 0.3 }
        ]}
      >
        <Text fontSize={25}>{icon}</Text>
        <Text fontSize={16} weight="semiBold">
          x{multiplier}
        </Text>
        <Svg
          width="73.409"
          height="84.533"
          style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }}
        >
          <Path d="M.5.5v72.234l36.2 11.271 36.2-11.271V.495Z" fill={color} stroke={colors.titan} />
        </Svg>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Button
        onPress={openBottomSheet}
        type="outline"
        size="small"
        text={
          isLoading
            ? t('Updating...')
            : t('{{pendingTokensTotal}} WALLET Rewards', {
                pendingTokensTotal
              })
        }
        style={flexboxStyles.alignSelfCenter}
      />
      <BottomSheet
        id="rewards"
        dynamicInitialHeight={false}
        sheetRef={sheetRef}
        isOpen={isOpen}
        closeBottomSheet={closeBottomSheet}
        displayCancel={false}
      >
        <Title>{t('Wallet token distribution')}</Title>

        <View style={[flexboxStyles.directionRow, flexboxStyles.center, spacings.mb]}>
          {multiplierBadges.map(renderBadge)}
        </View>

        <Text type="caption" style={[spacings.mbSm, textStyles.center]}>
          <Text type="caption">
            {t(
              'You are receiving $WALLETS for holding funds on your Ambire wallet as an early user. '
            )}
          </Text>
          <Text onPress={handleReadMore} underline type="caption">
            {t('Read More')}
          </Text>
        </Text>

        <Row index={0}>
          <View style={[spacings.prTy, flexboxStyles.flex1]}>
            <Text>{t('Early users Incentive')}</Text>
          </View>
          <View style={[spacings.plTy, { width: 160 }]}>
            <Text color={colors.primaryAccentColor} style={textStyles.right}>
              {rewards[RewardIds.BALANCE_REWARDS]}
            </Text>
            <Text type="small" style={textStyles.right}>
              {walletTokenAPY}% APY
            </Text>
          </View>
        </Row>
        <Row index={1}>
          <View style={[spacings.prTy, flexboxStyles.flex1]}>
            <Text>{t('ADX Staking Bonus')}</Text>
          </View>
          <View style={[spacings.plTy, { width: 160 }]}>
            <Text color={colors.primaryAccentColor} style={textStyles.right}>
              {rewards[RewardIds.ADX_REWARDS]}
            </Text>
            <Text type="small" style={textStyles.right}>
              {adxTokenAPY}% APY
            </Text>
          </View>
        </Row>
        <Row index={2}>
          <View style={[spacings.prTy, flexboxStyles.flex1]}>
            <Text>{t('Claimable now: early users + ADX Staking bonus')}</Text>
          </View>
          <View style={[spacings.plTy, { width: 160 }]}>
            <Text color={colors.primaryAccentColor} style={textStyles.right}>
              {currentClaimStatus.loading ? '...' : claimableNow}
            </Text>
            <Text type="small" style={textStyles.right}>
              <Text type="small" color={colors.secondaryAccentColor}>
                $
              </Text>
              {claimableNowUsd}
            </Text>
          </View>
        </Row>
        <Row index={3}>
          <View style={flexboxStyles.directionRow}>
            <Button disabled size="small" text={t('Claim with Burn')} style={spacings.mrMi} />
            <Button disabled size="small" text={t('Claim in xWALLET')} style={spacings.mlMi} />
          </View>
        </Row>
        {!!currentClaimStatus.mintableVesting && !!vestingEntry && (
          <>
            <Row index={4}>
              <View style={[spacings.prTy, flexboxStyles.flex1]}>
                <Text>{t('Claimable early supporters vesting')}</Text>
              </View>
              <View style={[spacings.plTy, { width: 160 }]}>
                <Text color={colors.primaryAccentColor} style={textStyles.right}>
                  {currentClaimStatus.mintableVesting}
                </Text>
                <Text type="small" style={textStyles.right}>
                  <Text type="small" color={colors.secondaryAccentColor}>
                    $
                  </Text>
                  {mintableVestingUsd}
                </Text>
              </View>
            </Row>
            <Row index={5} style={spacings.mb}>
              <View style={flexboxStyles.flex1}>
                <Button disabled size="small" text={t('Claim')} />
              </View>
            </Row>
          </>
        )}
        {!!stakedAmount && (
          <Row index={0}>
            <View style={[spacings.prTy, flexboxStyles.flex1]}>
              <Text>{t('Staked WALLET')}</Text>
            </View>
            <View style={[spacings.plTy, { width: 160 }]}>
              <Text color={colors.primaryAccentColor} style={textStyles.right}>
                {stakedAmount}
              </Text>
              <Text type="small" style={textStyles.right}>
                {xWALLETAPY}% APY
              </Text>
            </View>
          </Row>
        )}
      </BottomSheet>
    </>
  )
}

export default Rewards
