import { formatUnits } from 'ethers'
import React, { useId, useMemo } from 'react'
import { View } from 'react-native'

import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Avatar from '@common/components/Avatar'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

const PayOption = ({
  feeOption,
  amountUsd,
  disabledReason,
  disabledTextAppearance = 'errorText',
  amount,
  paidByAccountLabel,
  shouldHighlightExtremeGasFee = false
  // showAccountBalanceBadge = false // Note: Under discussion
}: {
  feeOption: FeePaymentOption
  amountUsd: string
  amount: bigint
  paidByAccountLabel: string | undefined
  disabledReason?: string
  disabledTextAppearance?: 'errorText' | 'infoText'
  shouldHighlightExtremeGasFee?: boolean
  // showAccountBalanceBadge?: boolean // Note: Under discussion
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const signAccountOpState = useController('SignAccountOpController').state
  // The global tooltip anchors to the first element with a matching id, and this option renders
  // in several places at once (each menu row and the selected value), so each needs its own id
  const safeFeeOptionTooltipId = useId()

  const paidByAccountData = useMemo(
    () => accounts.find((a) => a.addr === feeOption.paidBy),
    [accounts, feeOption.paidBy]
  )

  const formattedAmount = useMemo(() => {
    return formatDecimals(Number(formatUnits(amount, feeOption.token.decimals)), 'amount')
  }, [amount, feeOption.token.decimals])

  const warning = useMemo(() => {
    if (!signAccountOpState) return

    return signAccountOpState.warnings.find(
      ({ id }) => id === 'estimation-retry' || id === 'feeTokenPriceUnavailable'
    )
  }, [signAccountOpState])

  const isPaidByAnotherAccount = feeOption.paidBy !== account?.addr
  const isGasTank = !!feeOption.token.flags.onGasTank
  // Note: Under discussion
  // const showWalletBalanceBadge =
  //   showAccountBalanceBadge && !isGasTank && !isPaidByAnotherAccount

  // Web only: explains the two ways a Safe can pay by itself, as it can't send its own transactions
  const safeFeeOptionTooltip = useMemo(() => {
    if (!isWeb || !account?.safeCreation || isPaidByAnotherAccount) return null

    if (isGasTank)
      return t(
        "The fee comes out of your Gas Tank and the transaction is sent for you. None of your other accounts gets publicly linked to this Safe, so it's the most private way to pay."
      )

    if (feeOption.token.address === ZERO_ADDRESS)
      // This row is the network's native token, so its symbol is the one the other accounts pay in
      return t(
        "A Safe can't send transactions by itself, so another account has to send them and pay the fee. Pay with your Gas Tank, or with {{nativeSymbol}} from one of your other accounts listed below.",
        { nativeSymbol: feeOption.token.symbol }
      )

    return null
  }, [
    account?.safeCreation,
    feeOption.token.address,
    feeOption.token.symbol,
    isGasTank,
    isPaidByAnotherAccount,
    t
  ])

  if (!paidByAccountData) return null

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        {
          width: '100%'
        }
      ]}
    >
      {isGasTank ? (
        <View style={styles.gasTankIconContainer}>
          <GasTankIcon width={24} height={24} color={theme.primaryAccent} />
        </View>
      ) : (
        <TokenIcon
          containerStyle={{
            width: 32,
            height: 32
          }}
          withContainer
          width={28}
          height={28}
          networkSize={14}
          address={feeOption.token.address}
          chainId={feeOption.token.chainId}
          skeletonAppearance="secondaryBackground"
        />
      )}

      <View style={[flexbox.flex1, spacings.mlTy, spacings.mrTy]}>
        {disabledReason && !isPaidByAnotherAccount ? (
          <View>
            <Text weight="semiBold" fontSize={14} numberOfLines={1}>
              {formatDecimals(Number(amountUsd), 'value')}
            </Text>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text fontSize={12} numberOfLines={1} style={spacings.mrTy}>
                {formattedAmount} {feeOption.token.symbol}
              </Text>
              <Text
                fontSize={isMobile ? 10 : 12}
                numberOfLines={1}
                appearance={disabledTextAppearance}
              >
                {disabledReason}
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              {/* An option that can't pay shows only what it lacks, so its cost in USD is left out */}
              {disabledReason ? (
                <>
                  <Text weight="semiBold" fontSize={14} numberOfLines={1} style={spacings.mrTy}>
                    {formattedAmount} {feeOption.token.symbol}
                  </Text>
                  <Text
                    fontSize={isMobile ? 10 : 12}
                    numberOfLines={1}
                    appearance={disabledTextAppearance}
                    style={{ flexShrink: 1 }}
                  >
                    {disabledReason}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    weight="semiBold"
                    fontSize={14}
                    numberOfLines={1}
                    appearance={shouldHighlightExtremeGasFee ? 'warningText' : 'primaryText'}
                  >
                    {formatDecimals(Number(amountUsd), 'value')}
                  </Text>
                  {isPaidByAnotherAccount && (
                    <Text
                      appearance={shouldHighlightExtremeGasFee ? 'warningText' : 'secondaryText'}
                      weight="medium"
                      fontSize={12}
                      numberOfLines={1}
                      style={[spacings.mlTy, { flexShrink: 1 }]}
                    >
                      {formattedAmount} {feeOption.token.symbol}
                    </Text>
                  )}
                </>
              )}
              {/* Note: Under discussion */}
              {/* {showWalletBalanceBadge && (
                <View style={styles.walletBalanceBadge}>
                  <Text fontSize={10} weight="medium" appearance="infoText">
                    {t('in account')}
                  </Text>
                </View>
              )} */}
            </View>
            {isPaidByAnotherAccount ? (
              // Only a long account name is cut, "Paid by" and the address always stay whole
              <View style={[flexbox.directionRow, flexbox.alignCenter, { gap: SPACING_MI }]}>
                <Text
                  fontSize={12}
                  appearance="secondaryText"
                  numberOfLines={1}
                  style={{ flexShrink: 0 }}
                >
                  {t('Paid by')}
                </Text>
                <Avatar
                  size={16}
                  address={feeOption.paidBy}
                  pfp={feeOption.paidBy}
                  style={spacings.pr0}
                  displayTypeBadge={false}
                />
                <Text
                  fontSize={12}
                  weight="semiBold"
                  numberOfLines={1}
                  style={{ flexShrink: 1, minWidth: 0 }}
                >
                  {paidByAccountLabel || shortenAddress(feeOption.paidBy, 13)}
                </Text>
                {!!paidByAccountLabel && (
                  <Text
                    fontSize={12}
                    appearance="secondaryText"
                    numberOfLines={1}
                    style={{ flexShrink: 0 }}
                  >
                    ({shortenAddress(feeOption.paidBy, 13)})
                  </Text>
                )}
              </View>
            ) : (
              <Text
                appearance={shouldHighlightExtremeGasFee ? 'warningText' : 'secondaryText'}
                weight="medium"
                fontSize={12}
                numberOfLines={1}
              >
                {formattedAmount} {feeOption.token.symbol}
              </Text>
            )}
          </View>
        )}
      </View>
      {!!safeFeeOptionTooltip && (
        <InfoIcon
          width={16}
          height={16}
          color={theme.secondaryText}
          style={spacings.mlTy}
          dataSet={createGlobalTooltipDataSet({
            id: safeFeeOptionTooltipId,
            content: safeFeeOptionTooltip
          })}
        />
      )}
      {warning && (
        <WarningIcon
          width={20}
          height={20}
          style={spacings.mlTy}
          dataSet={createGlobalTooltipDataSet({
            id: 'estimation-warning',
            content: warning.title
          })}
          color={theme.warningText}
        />
      )}
    </View>
  )
}

export default React.memo(PayOption)
