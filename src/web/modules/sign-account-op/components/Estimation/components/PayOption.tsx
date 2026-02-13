import { formatUnits } from 'ethers'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
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
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'

import getStyles from './styles'

const PayOption = ({
  feeOption,
  amountUsd,
  disabledReason,
  disabledTextAppearance = 'errorText',
  amount
}: {
  feeOption: FeePaymentOption
  amountUsd: string
  amount: bigint
  disabledReason?: string
  disabledTextAppearance?: 'errorText' | 'infoText'
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { accounts } = useAccountsControllerState()
  const { account } = useSelectedAccountControllerState()
  const { networks } = useNetworksControllerState()
  const signAccountOpState = useSignAccountOpControllerState()

  const paidByAccountData = useMemo(
    () => accounts.find((a) => a.addr === feeOption.paidBy),
    [accounts, feeOption.paidBy]
  )

  const formattedAmount = useMemo(() => {
    return formatDecimals(Number(formatUnits(amount, feeOption.token.decimals)), 'amount')
  }, [amount, feeOption.token.decimals])

  const feeTokenNetworkName = useMemo(() => {
    if (feeOption.token.flags.onGasTank) {
      return 'Gas Tank'
    }

    return networks.find((n) => n.chainId === feeOption.token.chainId)?.name || ''
  }, [feeOption.token.flags.onGasTank, feeOption.token.chainId, networks])

  const warning = useMemo(() => {
    if (!signAccountOpState) return

    return signAccountOpState.warnings.find(
      ({ id }) => id === 'estimation-retry' || id === 'feeTokenPriceUnavailable'
    )
  }, [signAccountOpState])

  const isPaidByAnotherAccount = feeOption.paidBy !== account?.addr

  const paidByLabel = useMemo(() => {
    return paidByAccountData?.preferences.label
  }, [paidByAccountData?.preferences.label])

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
      <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, spacings.mrTy]}>
        {feeOption.token.flags.onGasTank ? (
          <View style={styles.gasTankIconWrapper}>
            <GasTankIcon
              color={theme.primaryAccent300}
              width={20}
              height={20}
              style={{ marginLeft: 2 }}
            />
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
            onGasTank={feeOption.token.flags.onGasTank}
            skeletonAppearance="secondaryBackground"
          />
        )}

        <View style={[flexbox.flex1, spacings.mlTy]}>
          <Text weight="semiBold" fontSize={13} numberOfLines={1}>
            {formattedAmount} {feeOption.token.symbol}{' '}
            {!!feeOption.token.flags.onGasTank && (
              <View style={styles.gasTankBadge}>
                <Text fontSize={10} color="white" weight="medium">
                  {t('Gas Tank')}
                </Text>
              </View>
            )}
          </Text>

          {disabledReason ? (
            <Text
              weight="medium"
              fontSize={12}
              numberOfLines={1}
              appearance={disabledTextAppearance}
            >
              {disabledReason}
            </Text>
          ) : (
            <Text appearance="secondaryText" weight="medium" fontSize={12}>
              {formatDecimals(Number(amountUsd), 'value')}
            </Text>
          )}
        </View>
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
              {paidByLabel}
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
