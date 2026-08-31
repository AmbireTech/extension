import { formatUnits } from 'ethers'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Avatar from '@common/components/Avatar'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

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
  const { styles, theme } = useTheme(getStyles)
  const { accounts } = useController('AccountsController').state
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const signAccountOpState = useController('SignAccountOpController').state

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
        {disabledReason ? (
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
              <Text
                weight="semiBold"
                fontSize={14}
                numberOfLines={1}
                appearance={shouldHighlightExtremeGasFee ? 'warningText' : 'primaryText'}
              >
                {formatDecimals(Number(amountUsd), 'value')}
              </Text>
              {/* Note: Under discussion */}
              {/* {showWalletBalanceBadge && (
                <View style={styles.walletBalanceBadge}>
                  <Text fontSize={10} weight="medium" appearance="infoText">
                    {t('in account')}
                  </Text>
                </View>
              )} */}
            </View>
            <Text
              appearance={shouldHighlightExtremeGasFee ? 'warningText' : 'secondaryText'}
              weight="medium"
              fontSize={12}
              numberOfLines={1}
            >
              {formattedAmount} {feeOption.token.symbol}
            </Text>
          </View>
        )}
      </View>
      {isPaidByAnotherAccount && (
        <View style={[flexbox.alignEnd]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Avatar
              size={16}
              address={feeOption.paidBy}
              pfp={feeOption.paidBy}
              style={spacings.prTy}
              displayTypeBadge={false}
            />
            <Text fontSize={12} weight="semiBold" numberOfLines={1}>
              {paidByAccountLabel}
            </Text>
          </View>
          <Text fontSize={10} weight="medium">
            {shortenAddress(feeOption.paidBy, 13)}
          </Text>
        </View>
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
