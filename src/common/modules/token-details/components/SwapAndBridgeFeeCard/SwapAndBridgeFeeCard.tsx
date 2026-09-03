import { formatUnits } from 'ethers'
import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { STK_WALLET, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { getFeePercent } from '@ambire-common/libs/swapAndBridge/fee'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import FeeInfoBottomSheet from '@common/modules/swap-and-bridge/components/FeeInfoBottomSheet'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { TokenResult } from '@ambire-common/libs/portfolio'

const selectPortfolioTokens = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.tokens

export const isWalletStakingToken = ({
  chainId,
  address
}: Pick<TokenResult, 'chainId' | 'address'>) =>
  chainId === ETHEREUM_CHAIN_ID && WALLET_TOKEN.toLowerCase() === address.toLowerCase()

const SwapAndBridgeFeeCardContent = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { navigate } = useNavigation()
  const {
    ref: feeInfoSheetRef,
    open: openFeeInfoBottomSheet,
    close: closeFeeInfoBottomSheet
  } = useModalize()
  const { state: portfolioTokens } = useController(
    'SelectedAccountController',
    selectPortfolioTokens
  )
  const stkWalletToken = useMemo(
    () =>
      portfolioTokens.find(
        (token) =>
          token.chainId === ETHEREUM_CHAIN_ID &&
          token.address.toLowerCase() === STK_WALLET.toLowerCase()
      ),
    [portfolioTokens]
  )
  const feePercent = useMemo(
    () =>
      getFeePercent(
        stkWalletToken
          ? Number(formatUnits(getTokenAmount(stkWalletToken), stkWalletToken.decimals))
          : 0
      ),
    [stkWalletToken]
  )
  const handleViewFeeTiers = useCallback(() => openFeeInfoBottomSheet(), [openFeeInfoBottomSheet])
  const handleStakeNow = useCallback(
    () => navigate(ROUTES.walletStaking, { state: { mode: 'stake' } }),
    [navigate]
  )

  return (
    <>
      <View style={[styles.card, spacings.phSm, spacings.pvSm, spacings.mbMd]}>
        <Text appearance="primaryText" fontSize={16} weight="semiBold">
          {t('Reduce your swap & bridge fees')}
        </Text>
        <Text appearance="secondaryText" fontSize={13}>
          {t('Stake $WALLET and pay as little as 0%')}
        </Text>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifyEnd,
            flexbox.wrap,
            spacings.mtSm
          ]}
        >
          <Button
            text={t('View fee tiers')}
            type="outline"
            size="small"
            accentColor={theme.primaryAccent300}
            onPress={handleViewFeeTiers}
            hasBottomSpacing={false}
            submitOnEnter={false}
            style={spacings.mrTy}
            testID="token-details-view-fee-tiers-button"
          />
          <Button
            text={t('Stake now')}
            size="small"
            onPress={handleStakeNow}
            hasBottomSpacing={false}
            submitOnEnter={false}
            testID="token-details-stake-now-button"
          />
        </View>
      </View>
      <FeeInfoBottomSheet
        sheetRef={feeInfoSheetRef}
        closeBottomSheet={closeFeeInfoBottomSheet}
        feePercent={feePercent}
      />
    </>
  )
}

const MemoizedSwapAndBridgeFeeCardContent = React.memo(SwapAndBridgeFeeCardContent)

const SwapAndBridgeFeeCard = ({ token }: { token: TokenResult }) => {
  if (!isWalletStakingToken(token)) return null

  return <MemoizedSwapAndBridgeFeeCardContent />
}

export default React.memo(SwapAndBridgeFeeCard)
